// src/lib/actions/release.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ReleaseType } from '@/types/database'

const ReleaseSchema = z.object({
  title: z.string().min(1).max(120),
  type: z.enum(['music', 'video', 'digital_art']),
  description: z.string().max(500).optional(),
  link_youtube: z.string().url().optional().or(z.literal('')),
  link_soundcloud: z.string().url().optional().or(z.literal('')),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published']).default('published'),
})

export type ReleaseFormData = z.infer<typeof ReleaseSchema>

export async function createRelease(formData: ReleaseFormData): Promise<{
  success: boolean
  error?: string
  releaseId?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Validate
  const parsed = ReleaseSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { data, error } = supabase.from('releases').insert({
    creator_id: user.id,
    title: parsed.data.title,
    type: parsed.data.type as ReleaseType,
    description: parsed.data.description || null,
    link_youtube: parsed.data.link_youtube || null,
    link_soundcloud: parsed.data.link_soundcloud || null,
    cover_image_url: parsed.data.cover_image_url || null,
    status: parsed.data.status,
    released_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  }).select('id').single()

  // TypeScript fix: chain awaits separately
  const result = await (supabase
    .from('releases')
    .insert({
      creator_id: user.id,
      title: parsed.data.title,
      type: parsed.data.type as ReleaseType,
      description: parsed.data.description || null,
      link_youtube: parsed.data.link_youtube || null,
      link_soundcloud: parsed.data.link_soundcloud || null,
      cover_image_url: parsed.data.cover_image_url || null,
      status: parsed.data.status,
      released_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
    })
    .select('id')
    .single())

  if (result.error) {
    console.error('[createRelease]', result.error)
    return { success: false, error: result.error.message }
  }

  return { success: true, releaseId: result.data.id }
}

export async function uploadCoverImage(file: File, userId: string): Promise<string | null> {
  const supabase = await createClient()

  const ext = file.name.split('.').pop()
  const path = `covers/${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('release-covers')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('[uploadCoverImage]', error)
    return null
  }

  const { data } = supabase.storage.from('release-covers').getPublicUrl(path)
  return data.publicUrl
}
