import { NextResponse } from 'next/server'

export async function GET() {
  const ai = Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL)
  const base44 = Boolean(process.env.BASE44_API_URL && process.env.BASE44_API_KEY)
  const storage = Boolean(process.env.STORAGE_ENDPOINT && process.env.STORAGE_BUCKET)
  const api = Boolean(process.env.CRYSTAL_API_KEY)

  return NextResponse.json({
    ok: true,
    service: 'vomi-crystal',
    configured: {
      ai,
      auth: base44,
      files: storage,
      api,
      base44,
      storage,
      turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY)
    },
    timestamp: new Date().toISOString()
  })
}
