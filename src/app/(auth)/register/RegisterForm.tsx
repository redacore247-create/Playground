// src/app/(auth)/register/page.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, AtSign, Loader2, Zap, Music, TrendingUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { registerWithEmail, loginWithGoogle } from '@/lib/actions/auth'

type Step = 'credentials' | 'identity' | 'role'

export function RegisterForm() {
  const [step, setStep] = useState<Step>('credentials')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, startGoogleTransition] = useTransition()

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    display_name: '',
    role: 'both' as 'artist' | 'bettor' | 'both',
  })

  function update(key: string, val: string) {
    setFormData(prev => ({ ...prev, [key]: val }))
    setError(null)
  }

  function validateStep(): string | null {
    if (step === 'credentials') {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Valid email required'
      if (formData.password.length < 8) return 'Password must be at least 8 characters'
    }
    if (step === 'identity') {
      if (!formData.username || formData.username.length < 3) return 'Username must be at least 3 characters'
      if (!/^[a-z0-9_]+$/.test(formData.username)) return 'Only lowercase letters, numbers, underscores'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    if (step === 'credentials') setStep('identity')
    else if (step === 'identity') setStep('role')
  }

  function handleSubmit() {
    const fd = new FormData()
    fd.append('email', formData.email)
    fd.append('password', formData.password)
    fd.append('username', formData.username)
    fd.append('display_name', formData.display_name || formData.username)

    startTransition(async () => {
      const result = await registerWithEmail(fd)
      if (!result.success) {
        setError(result.error ?? 'Registration failed')
        setStep('credentials')
      }
    })
  }

  function handleGoogle() {
    startGoogleTransition(async () => {
      const result = await loginWithGoogle()
      if (!result.success) setError(result.error ?? 'Google login failed')
    })
  }

  const STEPS = ['credentials', 'identity', 'role']
  const stepIdx = STEPS.indexOf(step)

  const ROLES = [
    {
      id: 'artist' as const,
      icon: Music,
      title: 'Artist',
      desc: 'Publish music, videos, and digital art',
      color: 'border-vibe-500/50 bg-vibe-500/8',
      iconColor: 'text-vibe-400',
    },
    {
      id: 'bettor' as const,
      icon: TrendingUp,
      title: 'Bettor',
      desc: 'Predict outcomes, tip creators, earn VP',
      color: 'border-plasma-500/50 bg-plasma-500/8',
      iconColor: 'text-plasma-400',
    },
    {
      id: 'both' as const,
      icon: Zap,
      title: 'Both',
      desc: 'Full Playground experience',
      color: 'border-amber-500/50 bg-amber-500/8',
      iconColor: 'text-amber-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center space-y-1">
        <h1 className="font-display font-bold text-2xl text-zinc-100">Join Playground</h1>
        <p className="text-sm text-zinc-500">Create, predict, and vibe together</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i <= stepIdx ? 'bg-vibe-500 w-6' : 'bg-zinc-700 w-4',
          )} />
        ))}
      </div>

      <div className="card-dark p-6 space-y-5">
        {/* ── Step 1: Credentials ── */}
        {step === 'credentials' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-medium text-zinc-200">Create your account</h2>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={isGooglePending}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900/60 text-zinc-200 text-sm font-medium hover:bg-zinc-800 transition-all active:scale-[0.98]"
            >
              {isGooglePending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">or email</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="input-glass w-full pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-glass w-full pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              <div className="flex gap-1 mt-1">
                {[8, 12, 16].map((len, i) => (
                  <div key={i} className={cn(
                    'h-0.5 flex-1 rounded-full transition-colors',
                    formData.password.length >= len ? 'bg-vibe-500' : 'bg-zinc-800',
                  )} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Identity ── */}
        {step === 'identity' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-medium text-zinc-200">Pick your identity</h2>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400">Username <span className="text-red-400">*</span></label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => update('username', e.target.value.toLowerCase())}
                  placeholder="your_username"
                  maxLength={24}
                  className="input-glass w-full pl-10"
                />
              </div>
              <p className="text-xs text-zinc-600">Lowercase, numbers, underscores only. Cannot be changed later.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400">Display name <span className="text-zinc-600">(optional)</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={e => update('display_name', e.target.value)}
                  placeholder={formData.username || 'Your Name'}
                  maxLength={60}
                  className="input-glass w-full pl-10"
                />
              </div>
            </div>

            {/* Preview */}
            {formData.username && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-vibe-500/20 border border-vibe-500/30 flex items-center justify-center font-bold text-vibe-400">
                  {(formData.display_name || formData.username)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {formData.display_name || formData.username}
                  </p>
                  <p className="text-xs text-zinc-500">@{formData.username}</p>
                </div>
                <div className="ml-auto vp-badge">
                  <Zap className="w-3 h-3" />100 VP
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Role ── */}
        {step === 'role' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="font-medium text-zinc-200 mb-0.5">What will you do?</h2>
              <p className="text-xs text-zinc-500">You can change this in settings later</p>
            </div>

            <div className="space-y-2">
              {ROLES.map(role => {
                const Icon = role.icon
                const isSelected = formData.role === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200',
                      isSelected ? role.color : 'border-zinc-800 hover:border-zinc-700',
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-zinc-950/50' : 'bg-zinc-800',
                    )}>
                      <Icon className={cn('w-5 h-5', isSelected ? role.iconColor : 'text-zinc-500')} />
                    </div>
                    <div className="flex-1">
                      <p className={cn('font-medium text-sm', isSelected ? 'text-zinc-100' : 'text-zinc-400')}>
                        {role.title}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">{role.desc}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-vibe-400 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Starter bonus */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-vibe-500/8 border border-vibe-500/20">
              <Zap className="w-5 h-5 text-vibe-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-vibe-300">100 Vibe Points on signup</p>
                <p className="text-xs text-zinc-500">Start betting and tipping right away</p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span className="mt-0.5">⚠</span>
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {stepIdx > 0 && (
            <button
              type="button"
              onClick={() => setStep(STEPS[stepIdx - 1] as Step)}
              className="btn-ghost flex-1"
            >
              Back
            </button>
          )}
          {step !== 'role' ? (
            <button
              type="button"
              onClick={next}
              className="btn-primary flex-1"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="btn-primary flex-1"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
              ) : (
                <><Zap className="w-4 h-4" />Create account</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-zinc-600">
        Already have an account?{' '}
        <Link href="/login" className="text-vibe-400 hover:text-vibe-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-zinc-700">
        By registering, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-zinc-500">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-zinc-500">Privacy Policy</Link>
      </p>
    </div>
  )
}
