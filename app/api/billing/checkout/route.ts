import { NextResponse } from 'next/server'

const plans: Record<string, { priceId?: string; label: string }> = {
  plus: { priceId: process.env.STRIPE_PLUS_PRICE_ID, label: 'Crystal Plus' },
  pro: { priceId: process.env.STRIPE_PRO_PRICE_ID, label: 'Crystal Pro' }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const plan = typeof body?.plan === 'string' ? body.plan : ''
  const selected = plans[plan]
  if (!selected) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 })

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret || !selected.priceId) {
    return NextResponse.json({
      ready: false,
      message: `${selected.label} checkout is ready for Stripe connection. Add STRIPE_SECRET_KEY and the matching Stripe price ID to enable payments.`
    }, { status: 503 })
  }

  const origin = new URL(req.url).origin
  const form = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': selected.priceId,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/?billing=success`,
    cancel_url: `${origin}/?billing=cancelled`,
    allow_promotion_codes: 'true'
  })

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || typeof data?.url !== 'string') {
    return NextResponse.json({ error: data?.error?.message || 'Stripe checkout could not be created.' }, { status: 502 })
  }
  return NextResponse.json({ ready: true, url: data.url })
}
