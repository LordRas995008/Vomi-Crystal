'use client'

import { useState } from 'react'

const features = [
  ['AI', 'One server-side AI gateway for your app.'],
  ['Files', 'Upload and store files without exposing storage keys.'],
  ['Auth', 'Keep identity and access behind one backend boundary.'],
  ['API', 'Give websites a clean Crystal endpoint to call.']
]

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Ready')

  async function ask() {
    if (!prompt.trim()) return
    setBusy(true); setStatus('Thinking…'); setAnswer('')
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setAnswer(data.output); setStatus(`Used ${data.usage?.total_tokens ?? 0} tokens`)
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : 'Something went wrong'); setStatus('Needs configuration')
    } finally { setBusy(false) }
  }

  return <main>
    <nav><div className="brand"><span className="crystal">✦</span> Vomi Crystal</div><span className="pill">Backend bridge</span></nav>
    <section className="hero">
      <div className="eyebrow">CONNECT YOUR APP · WITHOUT THE COMPLEXITY</div>
      <h1>Your app.<br/><span>Connected.</span></h1>
      <p>Crystal gives websites and apps one simple place for AI, authentication, files, storage, usage and APIs — with the complicated credentials kept on the server.</p>
      <div className="actions"><a href="#workspace" className="primary">Open workspace</a><a href="#architecture" className="secondary">See how it works</a></div>
    </section>
    <section className="grid" id="architecture">{features.map(([title, text]) => <article key={title}><div className="icon">{title[0]}</div><h3>{title}</h3><p>{text}</p></article>)}</section>
    <section className="workspace" id="workspace">
      <div><div className="eyebrow">AI WORKSPACE</div><h2>Test your connection</h2><p className="muted">This calls Crystal's real server-side AI route. Add an OpenAI-compatible provider key in your deployment environment to activate it.</p></div>
      <div className="console"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask Crystal something…" /><button disabled={busy || !prompt.trim()} onClick={ask}>{busy ? 'Working…' : 'Run AI'}</button>{answer && <div className="response"><small>{status}</small><p>{answer}</p></div>}</div>
    </section>
    <footer><span>Vomi Crystal</span><span>Server-side secrets · usage-aware · provider-neutral</span></footer>
  </main>
}
