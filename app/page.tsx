'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }
type CrystalAction = {
  type: 'navigate' | 'set_theme' | 'set_view' | 'highlight' | 'open_service' | 'set_focus'
  target?: string
  value?: string
}
type Health = { ok?: boolean; configured?: Record<string, boolean> }

const services = [
  { id: 'ai', icon: '✦', name: 'AI Gateway', desc: 'One secure, provider-neutral AI endpoint.', tint: 'violet' },
  { id: 'auth', icon: '⌁', name: 'Authentication', desc: 'Identity and access behind one boundary.', tint: 'blue' },
  { id: 'files', icon: '◇', name: 'Files & Storage', desc: 'Upload and store without exposing keys.', tint: 'cyan' },
  { id: 'api', icon: '↗', name: 'External API', desc: 'Clean endpoints for every Vomi app.', tint: 'pink' },
]

const starterMessages: Message[] = [{
  role: 'assistant',
  content: 'Hey — I’m Crystal. I can explain this workspace and control its interface. Try “show integrations”, “switch to dark mode”, “open AI Gateway”, or ask me anything about your backend.'
}]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(starterMessages)
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [view, setView] = useState('overview')
  const [focus, setFocus] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [health, setHealth] = useState<Health>({})
  const [assistantOpen, setAssistantOpen] = useState(true)
  const [billingNotice, setBillingNotice] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  function runAction(action: CrystalAction) {
    const target = action.target || action.value || ''
    if (action.type === 'set_theme' && (target === 'light' || target === 'dark')) setTheme(target)
    if (action.type === 'set_view' && ['overview', 'integrations', 'activity'].includes(target)) setView(target)
    if (action.type === 'set_focus') setFocus(target !== 'off')
    if (action.type === 'open_service' && services.some(s => s.id === target)) {
      setSelected(target); setView('integrations')
    }
    if (action.type === 'highlight' && services.some(s => s.id === target)) {
      setHighlight(target); setView('integrations')
      window.setTimeout(() => setHighlight(null), 2600)
    }
    if (action.type === 'navigate') {
      const el = document.getElementById(target)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function ask(e?: FormEvent) {
    e?.preventDefault()
    const text = prompt.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next); setPrompt(''); setBusy(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          messages: next.slice(-10),
          pageContext: { theme, view, focus, selected, services: services.map(s => s.id) },
          control: true
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Crystal could not respond.')
      setMessages(m => [...m, { role: 'assistant', content: data.output }])
      if (Array.isArray(data.actions)) data.actions.slice(0, 4).forEach(runAction)
    } catch (error) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Something went wrong. Check your AI connection.'
      }])
    } finally {
      setBusy(false)
    }
  }

  const configuredCount = Object.values(health.configured || {}).filter(Boolean).length
  const activeService = services.find(s => s.id === selected)

  async function choosePlan(plan: string) {
    setBillingNotice('')
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setBillingNotice(data.message || data.error || 'Billing is not connected yet.')
    } catch {
      setBillingNotice('Billing is not connected yet. Your workspace is unchanged.')
    }
  }

  return (
    <main className={focus ? 'focus-mode' : ''}>
      <div className="aurora a1" /><div className="aurora a2" /><div className="noise" />

      <header className="topbar">
        <button className="brand" onClick={() => setView('overview')} aria-label="Vomi Crystal home">
          <span className="brand-gem">✦</span><span>Vomi Crystal</span>
        </button>
        <div className="top-actions">
          <span className="status-chip"><i className={health.ok ? 'online' : ''} />{health.ok ? 'Systems ready' : 'Connecting'}</span>
          <button className="icon-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button>
          <button className="avatar">V</button>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <nav className="side-nav">
            {[
              ['overview', '⌂', 'Overview'],
              ['integrations', '◇', 'Integrations'],
              ['activity', '⌁', 'Activity'],
              ['pricing', '♢', 'Plans'],
            ].map(([id, icon, label]) => (
              <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>
          <div className="side-bottom">
            <button onClick={() => setFocus(v => !v)}><span>◎</span>{focus ? 'Exit focus' : 'Focus view'}</button>
            <div className="mini-card">
              <span className="mini-gem">✦</span>
              <div><b>Crystal AI</b><small>Page control enabled</small></div>
            </div>
          </div>
        </aside>

        <section className="content" id="workspace">
          {view === 'overview' && <>
            <div className="welcome">
              <div>
                <span className="kicker">CRYSTAL CONTROL CENTER</span>
                <h1>Good morning.<br/><em>Everything connects here.</em></h1>
                <p>A calm control layer for AI, authentication, storage and APIs — designed to feel simple even when the backend isn’t.</p>
              </div>
              <div className="orb-wrap"><div className="orb"><span>✦</span></div></div>
            </div>

            <div className="metrics">
              <article><span>Connected services</span><strong>{configuredCount}<small>/ 4</small></strong><div className="spark"><i/><i/><i/><i/><i/></div></article>
              <article><span>Crystal status</span><strong className="healthy">{health.ok ? 'Healthy' : 'Checking'}</strong><small>Secure server boundary</small></article>
              <article><span>AI assistant</span><strong>{health.configured?.ai ? 'Live' : 'Setup'}</strong><small>{health.configured?.ai ? 'Provider connected' : 'Add provider variables'}</small></article>
            </div>

            <div className="section-head"><div><span className="kicker">YOUR STACK</span><h2>Connected beautifully.</h2></div><button onClick={() => setView('integrations')}>Manage integrations <span>→</span></button></div>
            <div className="service-grid">
              {services.map(service => <button key={service.id} className={'service-card ' + service.tint + (highlight === service.id ? ' highlighted' : '')} onClick={() => setSelected(service.id)}>
                <div className="service-icon">{service.icon}</div>
                <div><h3>{service.name}</h3><p>{service.desc}</p></div>
                <span className={'dot ' + (health.configured?.[service.id] ? 'on' : '')} />
              </button>)}
            </div>
          </>}

          {view === 'integrations' && <div className="panel-page">
            <span className="kicker">INTEGRATIONS</span><h1>Build your stack.</h1><p className="page-lead">Crystal keeps credentials on the server and gives your apps one clean connection surface.</p>
            <div className="integration-list">{services.map(service =>
              <button key={service.id} className={'integration-row ' + (highlight === service.id ? 'highlighted' : '')} onClick={() => setSelected(service.id)}>
                <span className={'service-icon ' + service.tint}>{service.icon}</span>
                <span><b>{service.name}</b><small>{service.desc}</small></span>
                <span className="connection">{health.configured?.[service.id] ? 'Connected' : 'Configure'} →</span>
              </button>
            )}</div>
          </div>}

          {view === 'pricing' && <div className="panel-page">
            <span className="kicker">PLANS & BILLING</span><h1>Grow when you need to.</h1><p className="page-lead">Start free. Upgrade when Crystal becomes part of your daily build workflow. Checkout activates only after Stripe is connected.</p>
            <div className="pricing-grid">
              <article className="price-card"><span className="plan-name">Free</span><h2>$0<small>/mo</small></h2><p>For exploring Crystal and connecting a small project.</p><ul><li>1 workspace</li><li>Core integrations</li><li>Crystal AI basics</li><li>Community support</li></ul><button onClick={() => setBillingNotice('You are already on the Free plan.')}>Current plan</button></article>
              <article className="price-card featured"><span className="popular">MOST POPULAR</span><span className="plan-name">Crystal Plus</span><h2>$12<small>/mo</small></h2><p>For creators building and shipping real apps.</p><ul><li>Unlimited workspaces</li><li>Expanded AI usage</li><li>All integrations</li><li>Usage analytics</li><li>Priority workflows</li></ul><button className="gradient-btn" onClick={() => choosePlan('plus')}>Upgrade to Plus</button></article>
              <article className="price-card"><span className="plan-name">Crystal Pro</span><h2>$29<small>/mo</small></h2><p>For heavier projects, teams and advanced infrastructure.</p><ul><li>Everything in Plus</li><li>Higher usage limits</li><li>Advanced API access</li><li>Team-ready controls</li><li>Priority support</li></ul><button onClick={() => choosePlan('pro')}>Choose Pro</button></article>
            </div>
            {billingNotice && <div className="billing-notice">{billingNotice}</div>}
            <p className="billing-footnote">Prices are launch placeholders until you configure Stripe price IDs. No payment is collected by Crystal without Stripe configuration.</p>
          </div>}

          {view === 'activity' && <div className="panel-page">
            <span className="kicker">ACTIVITY</span><h1>Quietly observable.</h1><p className="page-lead">A simple operational view of the Crystal boundary.</p>
            <div className="activity-card">
              <div className="activity-icon">✓</div><div><b>Health endpoint responding</b><small>Crystal API · just now</small></div><span>200 OK</span>
            </div>
            <div className="activity-card">
              <div className="activity-icon">✦</div><div><b>AI gateway</b><small>Server-side provider</small></div><span>{health.configured?.ai ? 'Ready' : 'Needs setup'}</span>
            </div>
          </div>}
        </section>

        {!focus && <aside className={'assistant ' + (assistantOpen ? 'open' : 'closed')} id="assistant">
          <div className="assistant-head">
            <div><span className="ai-gem">✦</span><span><b>Crystal</b><small>AI copilot</small></span></div>
            <button onClick={() => setAssistantOpen(v => !v)}>{assistantOpen ? '×' : '✦'}</button>
          </div>
          {assistantOpen && <>
            <div className="messages">
              {messages.map((m, i) => <div key={i} className={'message ' + m.role}>{m.role === 'assistant' && <span className="tiny-gem">✦</span>}<p>{m.content}</p></div>)}
              {busy && <div className="message assistant"><span className="tiny-gem">✦</span><p className="typing"><i/><i/><i/></p></div>}
              <div ref={endRef}/>
            </div>
            <div className="suggestions">
              <button onClick={() => setPrompt('Show me the integrations')}>Show integrations</button>
              <button onClick={() => setPrompt('Open the AI Gateway')}>Open AI Gateway</button>
            </div>
            <form className="composer" onSubmit={ask}>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }} placeholder="Ask Crystal or control this page…" rows={2}/>
              <button disabled={busy || !prompt.trim()} aria-label="Send">↑</button>
            </form>
            <small className="control-note">✦ Crystal can control this page using approved UI actions.</small>
          </>}
        </aside>}
      </div>

      {activeService && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
        <div className="modal" onMouseDown={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelected(null)}>×</button>
          <span className={'service-icon large ' + activeService.tint}>{activeService.icon}</span>
          <span className="kicker">CRYSTAL INTEGRATION</span><h2>{activeService.name}</h2><p>{activeService.desc}</p>
          <div className="config-box"><span>Status</span><b>{health.configured?.[activeService.id] ? '● Connected' : '○ Configuration required'}</b></div>
          <button className="gradient-btn" onClick={() => { setSelected(null); setAssistantOpen(true); setPrompt('Help me configure ' + activeService.name) }}>Configure with Crystal</button>
        </div>
      </div>}
    </main>
  )
}
