import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vomi-crystal.vercel.app'),
  title: { default: 'Vomi Crystal', template: '%s · Vomi Crystal' },
  description: 'A calm AI-powered control center for app backends, integrations, files and APIs.',
  applicationName: 'Vomi Crystal',
  keywords: ['Vomi Crystal', 'AI backend', 'app builder', 'developer tools', 'AI copilot'],
  openGraph: {
    title: 'Vomi Crystal',
    description: 'Connect AI, authentication, files and APIs from one beautiful control center.',
    type: 'website',
    siteName: 'Vomi Crystal'
  },
  twitter: { card: 'summary', title: 'Vomi Crystal', description: 'Your AI-powered backend control center.' },
  robots: { index: true, follow: true }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a12' }
  ]
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
