import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ROYAL_BANKING_TOKEN = Deno.env.get('ROYAL_BANKING_TOKEN')
    if (!ROYAL_BANKING_TOKEN) {
      console.error("[royal-banking-payment] ROYAL_BANKING_TOKEN não configurada no Supabase.");
      throw new Error('Configuração de token pendente.')
    }

    const { name, email, document, phone, amount, items } = await req.json()

    // Payload para a API da Royal Banking (Baseado na integração padrão REST)
    const payload = {
      customer: {
        name,
        email,
        document,
        phone: phone.replace(/\D/g, '')
      },
      payment_method: 'pix',
      amount: Math.round(amount * 100), // Valor em centavos
      items: items.map((item: any) => ({
        title: item.name,
        unit_price: Math.round(item.price * 100),
        quantity: 1
      })),
      postback_url: 'https://wdxgxbvrealcalipuzay.supabase.co/functions/v1/payment-webhook'
    }

    console.log("[royal-banking-payment] Iniciando requisição para Royal Banking...");

    const response = await fetch('https://api.royalbanking.com.br/api/v1/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ROYAL_BANKING_TOKEN}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[royal-banking-payment] Erro na API Royal Banking:", data);
      return new Response(JSON.stringify({ error: data.message || 'Erro na API de pagamentos' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("[royal-banking-payment] Erro interno:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})