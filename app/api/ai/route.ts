import { NextResponse } from 'next/server'

function authOK(req: Request) {
  const configured = process.env.CRYSTAL_API_KEY
  if (!configured) return true
  return req.headers.get('authorization') === `Bearer ${configured}`
}

export async function POST(req: Request) {
  if (!authOK(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt || prompt.length > 12000) return NextResponse.json({ error: 'Prompt must be 1–12,000 characters.' }, { status: 400 })

  const base = process.env.AI_BASE_URL
  const key = process.env.AI_API_KEY
  const model = process.env.AI_MODEL
  if (!base || !key || !model) return NextResponse.json({ error: 'AI is not configured yet. Add AI_BASE_URL, AI_API_KEY and AI_MODEL to the server environment.' }, { status: 503 })

  const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: 'You are the Vomi Crystal assistant. Be concise, practical, and helpful to non-technical app builders.' }, { role: 'user', content: prompt }] })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'AI provider request failed.' }, { status: 502 })

  const output = data?.choices?.[0]?.message?.content
  if (typeof output !== 'string') return NextResponse.json({ error: 'AI provider returned an unexpected response.' }, { status: 502 })
  return NextResponse.json({ output, usage: data.usage ?? null })
}
