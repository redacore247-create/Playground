// src/app/(auth)/login/page.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Loader2, Chrome, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loginWithEmail, loginWithGoogle } from '@/lib/actions/auth'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'
  const authError = searchParams.get('error')

  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(
    authError === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  )
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, startGoogleTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await loginWithEmail(formData)
      if (!result.success) setError(result.error ?? 'Login failed')
    })
  }

  function handleGoogle() {
    startGoogleTransition(async () => {
      const result = await loginWithGoogle()
      if (!result.success) setError(result.error ?? 'Google login failed')
    })
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center space-y-1">
        <h1 className="font-display font-bold text-2xl text-zinc-100">Welcome back</h1>
        <p className="text-sm text-zinc-500">Sign in to your Playground account</p>
      </div>

      {/* Card */}
      <div className="card-dark p-6 space-y-5">
        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={isGooglePending || isPending}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900/60 text-zinc-200 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-600 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isGooglePending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-600">or</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Email form */}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="input-glass w-full pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Password</label>
              <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-glass w-full pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="mt-0.5">⚠</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || isGooglePending}
            className="btn-primary w-full py-3 text-base"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
            ) : (
              <><Zap className="w-4 h-4" />Sign in</>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-zinc-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-vibe-400 hover:text-vibe-300 font-medium transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  )
}
