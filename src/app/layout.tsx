// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Syne, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Playground', template: '%s · Playground' },
  description: 'Where everyone is an Artist or Bettor. Create, predict, tip, and vibe.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Playground',
    description: 'Create, predict, tip, and vibe.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-zinc-950 text-zinc-100 font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #3f3f46',
              color: '#f4f4f5',
            },
          }}
        />
      </body>
    </html>
  )
}
