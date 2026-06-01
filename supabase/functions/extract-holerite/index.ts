// @ts-nocheck
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é um extrator de dados de holerites brasileiros da empresa BTEX INDUSTRIA TEXTIL

ESTRUTURA DO DOCUMENTO:
- O documento contém dois recibos idênticos (via empresa + via funcionário). Use apenas o PRIMEIRO.
- O nome do funcionário está no campo "Nome do Funcionário", próximo a "CBO", "Departamento" e "Filial".
- O nome é sempre uma pessoa física em maiúsculas (ex: MARIA EDUARDA DOMINGOS MIGUEL).
- NUNCA confunda com nomes de empresa, cargos ou cabeçalhos de coluna.

TABELA DE ITENS:
- Cada linha tem: Código | Descrição | Referência | Vencimentos | Descontos
- "Vencimentos" = valor que o funcionário RECEBE (coluna da esquerda)
- "Descontos" = valor que é DESCONTADO (coluna da direita)
- Use 0.00 quando a coluna estiver vazia para aquele item

TOTAIS (rodapé do holerite):
- "Total de Vencimentos" = soma de todos os vencimentos
- "Total de Descontos" = soma de todos os descontos
- "Valor Líquido" = Total de Vencimentos - Total de Descontos

Retorne APENAS este JSON, sem markdown, sem texto adicional:
{
  "funcionario": "NOME COMPLETO",
  "competencia": "Mês Ano (ex: Abril de 2026)",
  "salario_base": 0.00,
  "itens": [
    { "codigo": "0000", "descricao": "DESCRIÇÃO", "referencia": "", "vencimento": 0.00, "desconto": 0.00 }
  ],
  "total_vencimentos": 0.00,
  "total_descontos": 0.00,
  "valor_liquido": 0.00
}`;

function stripJsonFence(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```$/m, "").trim();
  }
  return t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "image (data URL) é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia o holerite desta página. Retorne apenas o JSON solicitado." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: "Falha AI Gateway", status: res.status, detail: txt }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = stripJsonFence(content);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error("Resposta não é JSON válido: " + cleaned.slice(0, 200));
    }

    return new Response(JSON.stringify({ holerite: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
