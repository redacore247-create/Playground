// src/app/(auth)/layout.tsx
import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Radial glow top-left */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(74,185,74,0.4) 0%, transparent 70%)' }}
        />
        {/* Radial glow bottom-right */}
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(204,68,232,0.4) 0%, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-100" />
      </div>

      {/* Logo header */}
      <div className="relative z-10 flex justify-center pt-12 pb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-vibe-500 flex items-center justify-center shadow-lg shadow-vibe-500/30 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-2xl text-zinc-100">Playground</span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
