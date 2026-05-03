// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile exists (Google OAuth users might not trigger the DB trigger
      // if email is confirmed immediately)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!profile) {
        const email = data.user.email ?? ''
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
        const username = `${baseUsername}_${data.user.id.slice(0, 6)}`

        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          display_name: data.user.user_metadata?.full_name ?? username,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          vibe_points: 100,
        })
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
