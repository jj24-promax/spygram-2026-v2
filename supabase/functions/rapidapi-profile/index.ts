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
    const { username } = await req.json()

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://instagram120.p.rapidapi.com/api/instagram/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'instagram120.p.rapidapi.com',
        // Idealmente isso ficaria em uma variável de ambiente no Supabase, mas coloquei direto para funcionar na hora
        'x-rapidapi-key': '493c2fa593mshfeb076d2594dae3p1b97afjsne5129abe2c71'
      },
      body: JSON.stringify({ username })
    })

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`RapidAPI error: ${response.status}`, errorBody);
        throw new Error(`Erro na RapidAPI: ${response.status}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in proxy function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})