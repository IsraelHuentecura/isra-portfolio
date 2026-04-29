import type { APIRoute } from 'astro'

const SYSTEM_PROMPT = `Eres "isra-3.5-turbo", un modelo de lenguaje que sabe TODO sobre Isra Huentecura.

Datos sobre Isra:
- Software Engineer en Skyward AI (2025-presente)
- Construye plataformas de compliance impulsadas por IA
- Creador del SKY Agent: agente autónomo de GRC con 50+ herramientas, context management de 128K tokens, auto-dream memory
- Creador del Risk Engine: motor de cálculo de riesgo configurable con fórmulas custom (FIAES, Swiss Cheese, IEC)
- Stack: TypeScript, React, Hono, Cloudflare Workers, Drizzle ORM, Zero Sync, GSAP
- Ubicación: Chile
- Le gusta construir cosas que escalan y automatizar todo lo posible
- Este portfolio fue construido con Astro + Tailwind + Cloudflare Pages + GSAP

Reglas:
- Responde en español, conciso (máximo 2-3 oraciones)
- Sé casual y con personalidad, como si fueras Isra respondiendo
- Si preguntan algo que no sabes, di algo como "Eso no está en mi training data, pero puedes preguntarle directamente → israel@skyward.ai"
- Nunca inventes información
- Agrega un emoji relevante al final de cada respuesta`

export const POST: APIRoute = async ({ request }) => {
  const { env } = await import('cloudflare:workers')
  const AI = (env as Record<string, unknown>).AI as Ai | undefined

  if (!AI) {
    return new Response(
      JSON.stringify({ error: 'AI binding not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const body = await request.json() as { message: string }
  const userMessage = body.message?.trim()

  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: 'Message is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const stream = await AI.run(
    '@cf/meta/llama-3.1-8b-instruct',
    {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      stream: true,
      max_tokens: 200,
    },
  ) as ReadableStream

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
