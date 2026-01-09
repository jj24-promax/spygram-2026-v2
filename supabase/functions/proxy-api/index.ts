import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const API_BASE_URL = 'https://spypanel.shop';

serve(async (req) => {
  // Lida com a requisição pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Pega a chave secreta dos segredos do Supabase
    const API_SECRET_KEY = Deno.env.get('API_SECRET_KEY')
    if (!API_SECRET_KEY) {
      console.error("[proxy-api] Erro Crítico: A variável 'API_SECRET_KEY' não está configurada nos segredos do Supabase.");
      throw new Error('A chave de API do servidor não está configurada.')
    }

    // Extrai os parâmetros do corpo da requisição
    const { campo, username } = await req.json()
    if (!campo || !username) {
      return new Response(
        JSON.stringify({ error: 'Faltando "campo" ou "username" no corpo da requisição.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Monta a URL do serviço externo
    const targetUrl = `${API_BASE_URL}/api/field?campo=${encodeURIComponent(campo)}&username=${encodeURIComponent(username)}`

    // Faz a chamada para o serviço externo, enviando a chave secreta nos cabeçalhos
    const response = await fetch(targetUrl, {
      headers: { 
        'Accept': 'application/json',
        // Adicionando ambos os cabeçalhos para garantir compatibilidade
        'X-API-Secret': API_SECRET_KEY,
        'X-Api-Key': API_SECRET_KEY 
      }
    })

    // Lê o corpo da resposta como texto para depuração
    const responseBodyText = await response.text();
    let data;

    try {
      // Tenta analisar o corpo da resposta como JSON
      data = JSON.parse(responseBodyText);
    } catch (e) {
      // Se falhar, registra o erro e o corpo da resposta, e lança um erro claro
      console.error("[proxy-api] Falha ao analisar JSON da API externa. Status:", response.status, "Corpo:", responseBodyText);
      throw new Error("A API externa retornou uma resposta inválida (não-JSON).");
    }

    // Verifica se a resposta da API externa indica um erro
    if (!response.ok || data.success === false) {
        const errorMessage = data.error || data.message || `Erro da API externa: ${response.status}`;
        console.error(`[proxy-api] Erro da API externa:`, { status: response.status, message: errorMessage, body: data });
        // Retorna o erro específico para o frontend
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400, // Usa 400 para indicar um erro de requisição do cliente (ex: usuário não encontrado)
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Se tudo deu certo, retorna os dados para o frontend
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Captura qualquer outro erro no processo e o registra
    console.error('[proxy-api] Erro inesperado na função de proxy:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})