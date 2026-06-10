import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Token do UTMify configurado nos Secrets da Supabase
    const utmifyToken = Deno.env.get('UTMIFY_TOKEN')

    const payload = await req.json()
    console.log("[payment-webhook] Payload recebido:", JSON.stringify(payload));

    const transactionId = payload.idTransaction;
    const externalRef = payload.externalReference;
    const rawStatus = String(payload.status || '').toLowerCase();

    if (!rawStatus || (!transactionId && !externalRef)) {
      console.error("[payment-webhook] Payload inválido.");
      return new Response(JSON.stringify(400), { status: 400 });
    }

    let leadIdToUnlock = null;

    // 1. Tentar localizar o pagamento pela transaction_id
    if (transactionId) {
      // Busca o payload existente para preservar os itens inseridos na criação do PIX
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('payload')
        .eq('transaction_id', String(transactionId))
        .maybeSingle();

      const mergedPayload = {
        ...(existingPayment?.payload || {}),
        ...payload
      };

      const { data: paymentData } = await supabase
        .from('payments')
        .update({ 
          status: payload.status,
          payload: mergedPayload,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', String(transactionId))
        .select('lead_id')
        .single();
      
      if (paymentData?.lead_id) leadIdToUnlock = paymentData.lead_id;
    }

    // 2. Backup: Usar externalReference como lead_id direto
    if (!leadIdToUnlock && externalRef && String(externalRef).length > 20) {
      leadIdToUnlock = externalRef;
    }

    // 3. Verificação de Status (Lista de sucesso Royal Banking)
    const successStatuses = ['paid', 'saquepago', 'approved', 'success', 'pago'];
    const isPaid = successStatuses.includes(rawStatus);

    if (leadIdToUnlock && isPaid) {
      console.log(`[payment-webhook] LIBERANDO ACESSO -> Lead: ${leadIdToUnlock}`);
      
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'pagou' })
        .eq('id', leadIdToUnlock);

      if (leadError) console.error("[payment-webhook] Erro ao atualizar lead:", leadError.message);

      // --- NOVO PROCESSO DE CRIAÇÃO AUTOMÁTICA DE MEMBRO E CAPI ---
      try {
        const { data: leadData } = await supabase
          .from('leads')
          .select('email, phone, total_amount, full_name, document')
          .eq('id', leadIdToUnlock)
          .single();

        if (leadData) {
          
          // 1. Cria credenciais de acesso automático para o comprador
          if (leadData.email) {
            const cleanEmail = leadData.email.trim().toLowerCase();
            console.log(`[payment-webhook] Cadastrando acesso automático para o membro: ${cleanEmail}`);
            const { error: memberError } = await supabase
              .from('members')
              .upsert({
                email: cleanEmail,
                password: '123456' // Senha padrão
              }, { onConflict: 'email' });

            if (memberError) console.error("[payment-webhook] Erro ao cadastrar membro:", memberError.message);
          }

          // 2. Disparo de pixel de conversão Meta (CAPI)
          console.log(`[payment-webhook] Disparando CAPI Purchase para email: ${leadData.email}`);
          await supabase.functions.invoke('facebook-capi', {
            body: {
              eventName: 'Purchase',
              userData: {
                email: leadData.email,
                phone: leadData.phone
              },
              customData: {
                value: Number(leadData.total_amount) || 37.90,
                currency: 'BRL'
              }
            }
          });

          // 3. Disparo de conversão Server-to-Server para UTMify usando a API oficial de transações
          if (utmifyToken) {
            console.log(`[payment-webhook] Enviando transação Server-to-Server para UTMify...`);
            
            const utmifyPayload = {
              transacao: String(transactionId || externalRef),
              status: "pago",
              valor: Number(leadData.total_amount) || 37.90,
              email: leadData.email || "",
              nome: leadData.full_name || "Cliente SpyGram",
              telefone: leadData.phone ? leadData.phone.replace(/\D/g, '') : "",
              documento: leadData.document ? leadData.document.replace(/\D/g, '') : "",
              produto_nome: "Relatório SpyGram Completo",
              produto_id: "1"
            };

            const utmifyResponse = await fetch('https://api.utmify.com.br/api/v1/transacoes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${utmifyToken}`
              },
              body: JSON.stringify(utmifyPayload)
            });

            if (utmifyResponse.ok) {
              console.log("[payment-webhook] Transação enviada com sucesso para a API do UTMify!");
            } else {
              const utmifyErrorText = await utmifyResponse.text();
              console.error("[payment-webhook] Erro na API do UTMify:", utmifyErrorText);
            }
          } else {
            console.warn("[payment-webhook] UTMIFY_TOKEN não configurado nos secrets da Supabase.");
          }
        }
      } catch (postPayErr) {
        console.error("[payment-webhook] Falha ao processar ações automáticas pós-venda:", postPayErr.message);
      }
    } else {
      console.warn(`[payment-webhook] Não liberado. Lead: ${leadIdToUnlock}, Status: ${rawStatus}`);
    }

    // Retorno padrão Royal Banking
    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[payment-webhook] Erro Fatal:", error.message)
    return new Response(JSON.stringify(500), { status: 500 })
  }
})