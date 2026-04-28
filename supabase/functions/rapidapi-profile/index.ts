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
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY is not set in Supabase secrets.')
    }

    const { username } = await req.json()

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizado para o endpoint userInfo fornecido
    const response = await fetch('https://instagram120.p.rapidapi.com/api/instagram/userInfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'instagram120.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey
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