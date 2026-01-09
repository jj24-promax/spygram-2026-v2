import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const API_BASE_URL = 'https://spypanel.shop';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const API_SECRET_KEY = Deno.env.get('API_SECRET_KEY')
    if (!API_SECRET_KEY) {
      throw new Error('API_SECRET_KEY is not set in Supabase secrets.')
    }

    const { campo, username } = await req.json()

    if (!campo || !username) {
      return new Response(
        JSON.stringify({ error: 'Missing "campo" or "username" in request body.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // A chave secreta não será mais enviada na URL
    const targetUrl = `${API_BASE_URL}/api/field?campo=${encodeURIComponent(campo)}&username=${encodeURIComponent(username)}`

    // A chave secreta agora é enviada como um cabeçalho (header)
    const response = await fetch(targetUrl, {
      headers: { 
        'Accept': 'application/json',
        'X-API-Secret': API_SECRET_KEY
      }
    })

    const responseBodyText = await response.text();
    let data;
    try {
      data = JSON.parse(responseBodyText);
    } catch (e) {
      console.error("Failed to parse JSON from external API. Body:", responseBodyText);
      throw new Error("A API externa retornou uma resposta inesperada.");
    }

    // Verificação de erro mais robusta
    if (!response.ok || (data.success === false)) {
        const errorMessage = data.error || `External API error: ${response.status} ${response.statusText}`;
        console.error(`External API error:`, errorMessage, `Body:`, data);
        throw new Error(errorMessage)
    }

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