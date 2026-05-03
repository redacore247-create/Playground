// src/app/(main)/create-release/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { CreateReleaseForm } from '@/components/release/CreateReleaseForm'
import type { Profile } from '@/types/database'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Create Release' }

export default async function CreateReleasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/create-release')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  return (
    <>
      <header className="sticky top-0 z-40">
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60" />
        <div className="relative flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display font-bold text-lg text-zinc-100">
            New Release
          </h1>

          {!profile?.is_artist && (
            <span className="ml-auto text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded-lg">
              Artist mode
            </span>
          )}
        </div>
      </header>

      {!profile?.is_artist ? (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎨</span>
          </div>
          <h2 className="font-display font-bold text-xl text-zinc-100 mb-2">
            Become an Artist
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Enable Artist mode in your profile to publish releases.
          </p>
          <Link href="/settings" className="btn-primary">
            Go to Settings
          </Link>
        </div>
      ) : (
        <CreateReleaseForm />
      )}
    </>
  )
}
