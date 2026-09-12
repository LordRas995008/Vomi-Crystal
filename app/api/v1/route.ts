import { NextResponse } from 'next/server'

function authorized(req: Request) {
  const key = process.env.CRYSTAL_API_KEY
  return !key || req.headers.get('authorization') === `Bearer ${key}`
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ name: 'Vomi Crystal API', version: '1', capabilities: ['ai', 'storage', 'usage'], endpoints: { ai: '/api/ai', health: '/api/health' } })
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (body?.action === 'ai') {
    const prompt = typeof body.prompt === 'string' ? body.prompt : ''
    const upstream = new Request(new URL('/api/ai', req.url), { method: 'POST', headers: req.headers, body: JSON.stringify({ prompt }) })
    const response = await fetch(upstream)
    return NextResponse.json(await response.json(), { status: response.status })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
