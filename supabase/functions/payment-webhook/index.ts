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
    console.log("[payment-webhook] PAYLOAD RECEBIDO:", JSON.stringify(payload));

    const transactionId = payload.idTransaction;
    const externalRef = payload.externalReference;
    const status = payload.status;

    if (!status || (!transactionId && !externalRef)) {
      console.error("[payment-webhook] Payload inválido - Faltam IDs ou Status");
      return new Response(JSON.stringify(400), { status: 400 });
    }

    let leadIdToUnlock = null;

    // 1. Tentar localizar o pagamento pela transaction_id (ID da Royal)
    if (transactionId) {
      const { data: paymentData } = await supabase
        .from('payments')
        .update({ 
          status: status,
          payload: payload,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', String(transactionId))
        .select('lead_id')
        .single();
      
      if (paymentData?.lead_id) leadIdToUnlock = paymentData.lead_id;
    }

    // 2. Backup: Se não achou pelo payment, tenta usar o externalReference como lead_id direto
    // (Caso a API devolva nosso externalReference como o leadId enviado no cash in)
    if (!leadIdToUnlock && externalRef && typeof externalRef === 'string' && externalRef.length > 30) {
      console.log("[payment-webhook] Tentando identificar lead via externalReference...");
      leadIdToUnlock = externalRef;
    }

    // 3. Verificação de Status para Liberação
    const isPaid = ['paid', 'SaquePago', 'approved', 'success'].includes(status);

    if (leadIdToUnlock && isPaid) {
      console.log(`[payment-webhook] LIBERANDO ACESSO para Lead: ${leadIdToUnlock}`);
      
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'pagou' })
        .eq('id', leadIdToUnlock);

      if (leadError) {
        console.error("[payment-webhook] Erro ao atualizar lead:", leadError.message);
      } else {
        console.log("[payment-webhook] Lead atualizado com sucesso para 'pagou'");
      }
    } else {
      console.warn(`[payment-webhook] Sem liberação. Lead Encontrado: ${!!leadIdToUnlock}, Status Pago: ${isPaid}`);
    }

    // Retorno obrigatório exigido pela Royal Banking: json_encode(200)
    return new Response(JSON.stringify(200), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[payment-webhook] Erro Fatal:", error.message)
    return new Response(JSON.stringify(500), { status: 500 })
  }
})