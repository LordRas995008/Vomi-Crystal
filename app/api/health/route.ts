import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'vomi-crystal',
    configured: {
      ai: Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL),
      base44: Boolean(process.env.BASE44_API_URL && process.env.BASE44_API_KEY),
      storage: Boolean(process.env.STORAGE_ENDPOINT && process.env.STORAGE_BUCKET),
      turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY)
    },
    timestamp: new Date().toISOString()
  })
}
