// src/components/profile/SettingsClient.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Youtube, Music, TrendingUp, Zap, Save, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { updateProfile, logout } from '@/lib/actions/auth'
import type { Profile } from '@/types/database'

interface SettingsClientProps {
  profile: Profile
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    display_name: profile.display_name ?? '',
    bio: profile.bio ?? '',
    youtube_channel_id: profile.youtube_channel_id ?? '',
    soundcloud_username: profile.soundcloud_username ?? '',
    is_artist: profile.is_artist,
  })

  function update(key: string, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile(form)
      if (result.success) {
        setSaved(true)
        toast.success('Profile updated!')
        setTimeout(() => setSaved(false), 3000)
      } else {
        toast.error(result.error ?? 'Update failed')
      }
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60" />
        <div className="relative flex items-center gap-3 px-4 h-14">
          <Link
            href={`/profile/${profile.username}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display font-bold text-zinc-100">Settings</h1>
          <button
            onClick={handleSave}
            disabled={isPending}
            className={cn(
              'ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              saved
                ? 'bg-vibe-500/15 border border-vibe-500/30 text-vibe-400'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700',
            )}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Profile info */}
        <section className="space-y-4">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider">Profile</h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Display name
              </label>
              <input
                value={form.display_name}
                onChange={e => update('display_name', e.target.value)}
                placeholder="Your display name"
                maxLength={60}
                className="input-glass w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => update('bio', e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                maxLength={200}
                className="input-glass w-full resize-none"
              />
              <p className="text-right text-xs text-zinc-600">{form.bio.length}/200</p>
            </div>
          </div>
        </section>

        {/* Social connections */}
        <section className="space-y-4">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider">Social links</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Channel ID
              </label>
              <input
                value={form.youtube_channel_id}
                onChange={e => update('youtube_channel_id', e.target.value)}
                placeholder="UCxxxxxxxxxxxxxxxxxx"
                className="input-glass w-full font-mono text-sm"
              />
              <p className="text-xs text-zinc-600">Find it in YouTube Studio → Channel → Advanced</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-400">SoundCloud username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">soundcloud.com/</span>
                <input
                  value={form.soundcloud_username}
                  onChange={e => update('soundcloud_username', e.target.value)}
                  placeholder="your-username"
                  className="input-glass w-full pl-[140px] font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Role */}
        <section className="space-y-4">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider">Role</h2>
          <div className="space-y-2">
            <button
              onClick={() => update('is_artist', !form.is_artist)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
                form.is_artist
                  ? 'border-vibe-500/50 bg-vibe-500/8'
                  : 'border-zinc-800 hover:border-zinc-700',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                form.is_artist ? 'bg-vibe-500/20' : 'bg-zinc-800',
              )}>
                <Music className={cn('w-5 h-5', form.is_artist ? 'text-vibe-400' : 'text-zinc-500')} />
              </div>
              <div className="flex-1 text-left">
                <p className={cn('font-medium text-sm', form.is_artist ? 'text-zinc-100' : 'text-zinc-400')}>
                  Artist mode
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">Publish releases and open prediction markets</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                form.is_artist ? 'border-vibe-500 bg-vibe-500' : 'border-zinc-700',
              )}>
                {form.is_artist && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>

            <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 opacity-60">
              <div className="w-10 h-10 rounded-xl bg-plasma-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-plasma-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm text-zinc-300">Bettor mode</p>
                <p className="text-xs text-zinc-600">Always enabled for everyone</p>
              </div>
              <Check className="w-5 h-5 text-vibe-400" />
            </div>
          </div>
        </section>

        {/* Vibe Points info */}
        <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Vibe Points</p>
              <div className="vp-badge text-base px-3 py-1">
                <Zap className="w-4 h-4" />
                {profile.vibe_points.toLocaleString()} VP
              </div>
            </div>
            <Link href={`/profile/${profile.username}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              View history →
            </Link>
          </div>
        </section>

        {/* Danger zone */}
        <section className="space-y-3 pt-2 border-t border-zinc-800/60">
          <h2 className="text-xs text-zinc-600 uppercase tracking-wider">Account</h2>
          <p className="text-xs text-zinc-600">
            Username: <span className="font-mono text-zinc-400">@{profile.username}</span>
            {' · Cannot be changed'}
          </p>
          <button
            onClick={() => startTransition(() => logout())}
            className="w-full py-3 rounded-xl text-sm font-medium text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all"
          >
            Sign out
          </button>
        </section>
      </div>
    </div>
  )
}
