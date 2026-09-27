import { NextResponse } from 'next/server'

type UIAction = {
  type: 'navigate' | 'set_theme' | 'set_view' | 'highlight' | 'open_service' | 'set_focus'
  target?: string
  value?: string
}

const allowedTypes = new Set(['navigate', 'set_theme', 'set_view', 'highlight', 'open_service', 'set_focus'])
const allowedTargets = new Set(['workspace', 'assistant', 'overview', 'integrations', 'activity', 'ai', 'auth', 'files', 'api', 'light', 'dark', 'on', 'off'])

function authOK(req: Request) {
  const configured = process.env.CRYSTAL_API_KEY
  if (!configured) return true
  return req.headers.get('authorization') === `Bearer ${configured}`
}

function safeActions(value: unknown): UIAction[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 4).flatMap((item): UIAction[] => {
    if (!item || typeof item !== 'object') return []
    const action = item as Record<string, unknown>
    const type = typeof action.type === 'string' ? action.type : ''
    const target = typeof action.target === 'string' ? action.target : typeof action.value === 'string' ? action.value : ''
    if (!allowedTypes.has(type) || !allowedTargets.has(target)) return []
    return [{ type: type as UIAction['type'], target }]
  })
}

function extractJSON(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  const candidate = fenced || raw
  try { return JSON.parse(candidate) } catch {}
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try { return JSON.parse(candidate.slice(start, end + 1)) } catch {}
  }
  return null
}

export async function POST(req: Request) {
  if (!authOK(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt || prompt.length > 12000) {
    return NextResponse.json({ error: 'Prompt must be 1–12,000 characters.' }, { status: 400 })
  }

  const base = process.env.AI_BASE_URL
  const key = process.env.AI_API_KEY
  const model = process.env.AI_MODEL
  if (!base || !key || !model) {
    return NextResponse.json({ error: 'AI is not configured yet. Add AI_BASE_URL, AI_API_KEY and AI_MODEL to the server environment.' }, { status: 503 })
  }

  const control = body?.control === true
  const recent = Array.isArray(body?.messages)
    ? body.messages.slice(-8).flatMap((m: unknown) => {
        if (!m || typeof m !== 'object') return []
        const msg = m as Record<string, unknown>
        if ((msg.role !== 'user' && msg.role !== 'assistant') || typeof msg.content !== 'string') return []
        return [{ role: msg.role, content: msg.content.slice(0, 5000) }]
      })
    : []

  const pageContext = body?.pageContext && typeof body.pageContext === 'object'
    ? JSON.stringify(body.pageContext).slice(0, 3000)
    : '{}'

  const system = control
    ? `You are Crystal, the friendly AI copilot inside the Vomi Crystal backend control center.
You help non-technical app builders understand AI, authentication, storage, APIs and this dashboard.
You may control ONLY this page through a tiny approved action vocabulary. Never output or request JavaScript, DOM code, shell commands, credentials, secrets, destructive actions, purchases, or external side effects.

Current page context: ${pageContext}

Return ONLY valid JSON with this exact shape:
{"message":"helpful response","actions":[{"type":"set_view","target":"integrations"}]}

Allowed actions and targets:
- set_view: overview | integrations | activity
- set_theme: light | dark
- open_service: ai | auth | files | api
- highlight: ai | auth | files | api
- navigate: workspace | assistant
- set_focus: on | off

Use actions only when the user clearly asks to change/control the page or when an action directly helps. Maximum 4 actions. For normal questions, actions should be [].
Keep message concise and natural.`
    : 'You are the Vomi Crystal assistant. Be concise, practical, and helpful to non-technical app builders.'

  const providerMessages = recent.length
    ? [{ role: 'system', content: system }, ...recent]
    : [{ role: 'system', content: system }, { role: 'user', content: prompt }]

  const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: providerMessages,
      temperature: 0.35
    })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message || 'AI provider request failed.' }, { status: 502 })
  }

  const raw = data?.choices?.[0]?.message?.content
  if (typeof raw !== 'string') {
    return NextResponse.json({ error: 'AI provider returned an unexpected response.' }, { status: 502 })
  }

  if (!control) return NextResponse.json({ output: raw, usage: data.usage ?? null })

  const parsed = extractJSON(raw)
  const output = typeof parsed?.message === 'string' ? parsed.message : raw
  const actions = safeActions(parsed?.actions)
  return NextResponse.json({ output, actions, usage: data.usage ?? null })
}
