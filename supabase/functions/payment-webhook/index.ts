import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função utilitária para formatar datas no padrão UTC (YYYY-MM-DD HH:MM:SS) solicitado pela UTMify
const formatUTC = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Token oficial UTMify cadastrado nos Secrets da Supabase
    const utmifyToken = Deno.env.get('UTMIFY_TOKEN')

    const payload = await req.json()
    console.log("[payment-webhook] Webhook Royal Banking recebido:", JSON.stringify(payload));

    const transactionId = payload.idTransaction;
    const externalRef = payload.externalReference;
    const rawStatus = String(payload.status || '').toLowerCase();

    if (!rawStatus || (!transactionId && !externalRef)) {
      console.error("[payment-webhook] Payload inválido recebido no webhook.");
      return new Response(JSON.stringify(400), { status: 400 });
    }

    let leadIdToUnlock = null;
    let savedPaymentData: any = null;

    // 1. Localizar o pagamento e atualizar status no banco
    if (transactionId) {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('payload, lead_id')
        .eq('transaction_id', String(transactionId))
        .maybeSingle();

      if (existingPayment) {
        savedPaymentData = existingPayment.payload;
        if (existingPayment.lead_id) leadIdToUnlock = existingPayment.lead_id;

        const mergedPayload = {
          ...(savedPaymentData || {}),
          ...payload
        };

        // Salva os dados atualizados no banco
        await supabase
          .from('payments')
          .update({ 
            status: payload.status,
            payload: mergedPayload,
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', String(transactionId));
      }
    }

    // Backup caso falhe a busca da transação
    if (!leadIdToUnlock && externalRef && String(externalRef).length > 20) {
      leadIdToUnlock = externalRef;
    }

    // 2. Status de Confirmação
    const successStatuses = ['paid', 'saquepago', 'approved', 'success', 'pago'];
    const isPaid = successStatuses.includes(rawStatus);

    if (leadIdToUnlock && isPaid) {
      console.log(`[payment-webhook] LIBERANDO ACESSO -> Lead: ${leadIdToUnlock}`);
      
      // Atualiza o lead para status de pago
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ status: 'pagou' })
        .eq('id', leadIdToUnlock);

      if (leadUpdateError) console.error("[payment-webhook] Erro ao atualizar lead:", leadUpdateError.message);

      // --- CRIAÇÃO DE ACESSO E INTEGRAÇÃO OFICIAL UTMIFY ---
      try {
        const { data: leadData } = await supabase
          .from('leads')
          .select('email, phone, total_amount, full_name, document, ip_address, created_at')
          .eq('id', leadIdToUnlock)
          .single();

        if (leadData) {
          // 1. Cria conta de membro para login automático
          if (leadData.email) {
            const cleanEmail = leadData.email.trim().toLowerCase();
            await supabase
              .from('members')
              .upsert({
                email: cleanEmail,
                password: '123456'
              }, { onConflict: 'email' });
            console.log(`[payment-webhook] Membro ${cleanEmail} cadastrado.`);
          }

          // 2. API UTMIFY OFICIAL (POST /api-credentials/orders) -> UTMify se encarrega de disparar o CAPI Purchase de forma centralizada!
          if (utmifyToken) {
            console.log(`[payment-webhook] Enviando transação oficial para a API UTMify...`);

            // Recupera UTMs salvas no payment payload
            const utmParams = savedPaymentData?.utmParams || {};
            const tracking = {
              src: utmParams.src || null,
              sck: utmParams.sck || null,
              utm_source: utmParams.utm_source || null,
              utm_campaign: utmParams.utm_campaign || null,
              utm_medium: utmParams.utm_medium || null,
              utm_content: utmParams.utm_content || null,
              utm_term: utmParams.utm_term || null,
            };

            const createdDate = leadData.created_at ? new Date(leadData.created_at) : new Date();
            const approvedDate = new Date();

            const amountValue = Number(leadData.total_amount) || 37.90;
            const valueInCents = Math.round(amountValue * 100);

            // Estrutura o payload idêntico à documentação fornecida
            const utmifyOrderBody = {
              orderId: String(transactionId || externalRef),
              platform: "SpyGram",
              paymentMethod: "pix",
              status: "paid", // Status de sucesso documentado pela UTMify
              createdAt: formatUTC(createdDate),
              approvedDate: formatUTC(approvedDate),
              refundedAt: null,
              customer: {
                name: leadData.full_name || "Cliente SpyGram",
                email: leadData.email || "",
                phone: leadData.phone ? leadData.phone.replace(/\D/g, '') : null,
                document: leadData.document ? leadData.document.replace(/\D/g, '') : null,
                country: "BR",
                ip: leadData.ip_address || null
              },
              products: [
                {
                  id: "1",
                  name: "Relatório SpyGram Completo",
                  planId: null,
                  planName: null,
                  quantity: 1,
                  priceInCents: valueInCents
                }
              ],
              trackingParameters: tracking,
              commission: {
                totalPriceInCents: valueInCents,
                gatewayFeeInCents: Math.round(valueInCents * 0.05), // Exemplo: taxa de 5% cobrada
                userCommissionInCents: Math.round(valueInCents * 0.95) // Comissão do lojista
              },
              isTest: false
            };

            const utmifyResponse = await fetch('https://api.utmify.com.br/api-credentials/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-token': utmifyToken // Cabeçalho de API autenticado oficial
              },
              body: JSON.stringify(utmifyOrderBody)
            });

            if (utmifyResponse.ok) {
              console.log("[payment-webhook] Pedido UTMify enviado e atribuído com sucesso!");
            } else {
              const utmifyErrorText = await utmifyResponse.text();
              console.error("[payment-webhook] Erro de resposta do UTMify:", utmifyErrorText);
            }
          } else {
            console.warn("[payment-webhook] UTMIFY_TOKEN está ausente nos Secrets da Supabase.");
          }
        }
      } catch (postPayError) {
        console.error("[payment-webhook] Erro ao processar integrações de sucesso:", postPayError.message);
      }
    }

    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[payment-webhook] Erro Fatal:", error.message)
    return new Response(JSON.stringify(500), { status: 500 })
  }
})