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

    const ROYAL_BANKING_TOKEN = Deno.env.get('ROYAL_BANKING_TOKEN')
    if (!ROYAL_BANKING_TOKEN) {
      throw new Error('Configuração de token pendente.')
    }

    const { name, email, document, phone, amount, leadId, items } = await req.json()

    const cleanDocument = document.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');

    // Enviamos o leadId como externalReference para ter um backup de identificação
    const payload = {
      "api-key": ROYAL_BANKING_TOKEN,
      "amount": amount,
      "externalReference": leadId,
      "client": {
        "name": name,
        "document": cleanDocument,
        "telefone": cleanPhone,
        "email": email
      },
      "callbackUrl": 'https://vxlxifktgoazfgtilgyo.supabase.co/functions/v1/payment-webhook'
    }

    console.log(`[royal-banking-payment] Solicitando pagamento para lead ${leadId}...`);

    const response = await fetch('https://api.royalbanking.com.br/v1/gateway/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (response.ok && data.idTransaction) {
      // Registra o mapeamento transação <-> lead com o valor no payload, incluindo os itens comprados
      const { error: pError } = await supabase
        .from('payments')
        .insert({
          transaction_id: String(data.idTransaction),
          lead_id: leadId,
          status: 'pending',
          payload: { ...data, amount: amount, items: items || [] }
        });
      
      if (pError) console.error("[royal-banking-payment] Erro ao salvar payment:", pError.message);
      console.log(`[royal-banking-payment] Transação ${data.idTransaction} criada com sucesso.`);
    } else {
      console.error("[royal-banking-payment] Resposta inválida da API:", JSON.stringify(data));
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("[royal-banking-payment] Falha:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})