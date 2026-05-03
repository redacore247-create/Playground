// src/lib/actions/auth.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(24, 'Max 24 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  display_name: z.string().min(1).max(60).optional(),
})

export type AuthResult = { success: boolean; error?: string }

// ── Login ──────────────────────────────────────────────────────────────────

export async function loginWithEmail(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login')) return { success: false, error: 'Incorrect email or password' }
    return { success: false, error: error.message }
  }
  redirect('/')
}

// ── Register ───────────────────────────────────────────────────────────────

export async function registerWithEmail(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: (formData.get('username') as string).toLowerCase().trim(),
    display_name: (formData.get('display_name') as string) || undefined,
  }
  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = await createClient()

  // Check username availability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('username', parsed.data.username)
    .maybeSingle()

  if (existing) return { success: false, error: 'Username is already taken' }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        full_name: parsed.data.display_name ?? parsed.data.username,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) return { success: false, error: 'An account with this email already exists' }
    return { success: false, error: error.message }
  }

  if (data.user && parsed.data.display_name) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({ display_name: parsed.data.display_name })
      .eq('id', data.user.id)
  }

  redirect('/')
}

// ── OAuth ──────────────────────────────────────────────────────────────────

export async function loginWithGoogle(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) return { success: false, error: error.message }
  if (data.url) redirect(data.url)
  return { success: true }
}

// ── Logout ─────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Profile update ─────────────────────────────────────────────────────────

const ProfileUpdateSchema = z.object({
  display_name: z.string().max(60).optional(),
  bio: z.string().max(200).optional(),
  youtube_channel_id: z.string().max(60).optional(),
  soundcloud_username: z.string().max(60).optional(),
  is_artist: z.boolean().optional(),
})

export async function updateProfile(
  data: z.infer<typeof ProfileUpdateSchema>
): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = ProfileUpdateSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Follow / Unfollow ──────────────────────────────────────────────────────

export async function toggleFollow(targetUserId: string): Promise<{
  success: boolean
  following: boolean
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, following: false, error: 'Not authenticated' }
  if (user.id === targetUserId) return { success: false, following: false, error: 'Cannot follow yourself' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle()

  if (existing) {
    await db.from('follows').delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
    return { success: true, following: false }
  } else {
    await db.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
    return { success: true, following: true }
  }
}
