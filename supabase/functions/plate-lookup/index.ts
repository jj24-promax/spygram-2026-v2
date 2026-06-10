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
    const { plate } = await req.json()
    if (!plate) {
      return new Response(JSON.stringify({ error: 'Placa é obrigatória' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    console.log(`[plate-lookup] Iniciando busca para placa: ${cleanPlate}`)

    // Gateway 1: WDAPI
    try {
      console.log(`[plate-lookup] Tentando WDAPI para a placa ${cleanPlate}`)
      const wdResponse = await fetch(`https://wdapi2.com.br/api/fipe/placa/${cleanPlate}/json`)
      if (wdResponse.ok) {
        const data = await wdResponse.json()
        if (data && data.error === "0" && (data.marca || data.modelo)) {
          console.log(`[plate-lookup] Sucesso na WDAPI`)
          return new Response(JSON.stringify({
            marca: String(data.marca).toUpperCase(),
            modelo: String(data.modelo).toUpperCase(),
            cor: data.cor || 'N/A',
            ano: data.ano_modelo || data.ano || 'N/A',
            municipio: data.municipio || 'N/A',
            uf: data.uf || 'N/A',
            situacao: data.situacao || 'Sem restrição'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
      }
    } catch (err) {
      console.error(`[plate-lookup] Falha na WDAPI:`, err.message)
    }

    // Gateway 2: ApiCarros
    try {
      console.log(`[plate-lookup] Tentando ApiCarros para a placa ${cleanPlate}`)
      const acResponse = await fetch(`https://apicarros.com/v1/consulta/${cleanPlate}/json`)
      if (acResponse.ok) {
        const data = await acResponse.json()
        if (data && (data.marca || data.modelo)) {
          console.log(`[plate-lookup] Sucesso na ApiCarros`)
          return new Response(JSON.stringify({
            marca: String(data.marca).toUpperCase(),
            modelo: String(data.modelo).toUpperCase(),
            cor: data.cor || 'N/A',
            ano: data.anoModelo || data.ano || 'N/A',
            municipio: data.municipio || 'N/A',
            uf: data.uf || 'N/A',
            situacao: data.situacao || 'Sem restrição'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
      }
    } catch (err) {
      console.error(`[plate-lookup] Falha na ApiCarros:`, err.message)
    }

    return new Response(JSON.stringify({ error: 'Veículo não encontrado ou placa inválida na base do SENATRAN/DETRAN.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[plate-lookup] Erro fatal:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})