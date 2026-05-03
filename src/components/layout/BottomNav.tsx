// src/components/layout/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, Plus, Gamepad2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',            icon: Home,       label: 'Feed' },
  { href: '/markets',     icon: TrendingUp, label: 'Markets' },
  { href: '/create-release', icon: Plus,    label: 'Create', primary: true },
  { href: '/mini-games',  icon: Gamepad2,   label: 'Games' },
  { href: '/profile',     icon: User,       label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/60" />

      <div className="relative flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, primary }) => {
          const isActive = pathname === href ||
            (href !== '/' && pathname.startsWith(href))

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="relative -mt-5 flex flex-col items-center gap-1"
              >
                <div className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-2xl',
                  'bg-vibe-500 hover:bg-vibe-400 active:scale-95',
                  'transition-all duration-200',
                  'shadow-lg shadow-vibe-500/30',
                )}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] text-zinc-500">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl',
                'transition-all duration-200',
                isActive
                  ? 'bg-zinc-800 text-vibe-400'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[10px] transition-colors',
                isActive ? 'text-vibe-400' : 'text-zinc-600',
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
