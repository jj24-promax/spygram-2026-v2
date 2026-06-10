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

    const payload = await req.json()
    console.log("[payment-webhook] Webhook recebido via UTMify/Gateway:", JSON.stringify(payload));

    // Normalização Inteligente de Campos (Suporta Royal Banking, PerfectPay e outros integrados na UTMify)
    const email = (payload.email || payload.client?.email || payload.customer?.email || '').trim().toLowerCase();
    const phone = payload.phone || payload.client?.telefone || payload.customer?.phone || payload.celular || '';
    const name = payload.name || payload.client?.name || payload.customer?.name || payload.nome || '';
    const document = payload.document || payload.client?.document || payload.customer?.document || payload.cpf || '';
    
    // ID da Transação
    const transactionId = String(payload.idTransaction || payload.transacao || payload.transaction_id || payload.id || '');
    
    // Referência Externa
    const externalRef = payload.externalReference || payload.external_reference || payload.venda_codigo || payload.reference || '';
    
    // Normalização de Status (Suporta strings de status e códigos numéricos do PerfectPay como 1 e 3)
    const rawStatus = String(payload.status || '').toLowerCase();
    const isPaid = ['paid', 'saquepago', 'approved', 'success', 'pago', '1', '3', 'complete'].includes(rawStatus) || payload.status === 1 || payload.status === 3;

    if (!transactionId && !externalRef && !email) {
      console.error("[payment-webhook] Payload inválido ou incompleto.");
      return new Response(JSON.stringify({ error: "Invalid payload keys" }), { status: 400 });
    }

    let leadIdToUnlock = null;

    // 1. Tentar localizar o pagamento pelo ID da transação no banco
    if (transactionId) {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('lead_id, payload')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (existingPayment?.lead_id) {
        leadIdToUnlock = existingPayment.lead_id;
        
        // Atualiza o payload e o status do pagamento existente
        const mergedPayload = {
          ...(existingPayment.payload || {}),
          ...payload
        };

        await supabase
          .from('payments')
          .update({ 
            status: 'approved',
            payload: mergedPayload,
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', transactionId);
      }
    }

    // 2. Backup: Tentar usar externalReference como o próprio UUID do Lead
    if (!leadIdToUnlock && externalRef) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(String(externalRef))) {
        leadIdToUnlock = String(externalRef);
      }
    }

    // 3. Segurança Máxima: Se não achar pelos IDs, busca o lead mais recente pelo E-mail do comprador
    if (!leadIdToUnlock && email) {
      console.log(`[payment-webhook] Buscando lead de forma inteligente por e-mail: ${email}`);
      const { data: latestLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestLead?.id) {
        leadIdToUnlock = latestLead.id;
      }
    }

    // Se identificamos o lead e o status for Aprovado/Pago, liberamos o acesso
    if (leadIdToUnlock && isPaid) {
      console.log(`[payment-webhook] LIBERANDO ACESSO -> Lead ID: ${leadIdToUnlock}`);
      
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'pagou' })
        .eq('id', leadIdToUnlock);

      if (leadError) console.error("[payment-webhook] Erro ao atualizar status do lead:", leadError.message);

      // --- NOVO PROCESSO DE CRIAÇÃO AUTOMÁTICA DE MEMBRO E CAPI ---
      try {
        const { data: leadData } = await supabase
          .from('leads')
          .select('email, phone, total_amount, full_name, document')
          .eq('id', leadIdToUnlock)
          .single();

        if (leadData) {
          const finalEmail = (leadData.email || email).trim().toLowerCase();
          
          // 1. Cria credenciais de acesso automático para o comprador
          if (finalEmail) {
            console.log(`[payment-webhook] Cadastrando acesso automático para o membro: ${finalEmail}`);
            const { error: memberError } = await supabase
              .from('members')
              .upsert({
                email: finalEmail,
                password: '123456' // Senha padrão
              }, { onConflict: 'email' });

            if (memberError) console.error("[payment-webhook] Erro ao cadastrar membro:", memberError.message);
          }

          // 2. Disparo de pixel de conversão Meta CAPI
          console.log(`[payment-webhook] Disparando CAPI Purchase para e-mail: ${finalEmail}`);
          await supabase.functions.invoke('facebook-capi', {
            body: {
              eventName: 'Purchase',
              userData: {
                email: finalEmail,
                phone: leadData.phone || phone
              },
              customData: {
                value: Number(leadData.total_amount) || Number(payload.valor) || Number(payload.amount) || 37.90,
                currency: 'BRL'
              }
            }
          });

          // 3. Disparo de pixel de conversão UTMify
          console.log(`[payment-webhook] Disparando UTMify Purchase para e-mail: ${finalEmail}`);
          const utmifyPayload = {
            pixelId: "6a295a72acc979cfd9f187f3",
            eventName: "purchase",
            fullName: leadData.full_name || name || "",
            email: finalEmail,
            phone: (leadData.phone || phone || "").replace(/\D/g, ''),
            cpf: (leadData.document || document || "").replace(/\D/g, ''),
            value: Number(leadData.total_amount) || Number(payload.valor) || Number(payload.amount) || 37.90,
            currency: "BRL"
          };

          const utmifyResponse = await fetch('https://api.utmify.com.br/api/pixel/conversion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(utmifyPayload)
          });

          if (utmifyResponse.ok) {
            console.log("[payment-webhook] Evento de compra enviado com sucesso para UTMify!");
          } else {
            const utmifyErrorText = await utmifyResponse.text();
            console.error("[payment-webhook] Erro ao enviar evento para UTMify:", utmifyErrorText);
          }
        }
      } catch (postPayErr) {
        console.error("[payment-webhook] Falha ao processar ações automáticas pós-venda:", postPayErr.message);
      }
    } else {
      console.warn(`[payment-webhook] Webhook recebido mas não atendeu critérios de liberação. Lead: ${leadIdToUnlock}, Status Pago: ${isPaid}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[payment-webhook] Erro Fatal:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
})