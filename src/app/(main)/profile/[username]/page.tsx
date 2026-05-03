// src/app/(main)/profile/[username]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileByUsername } from '@/lib/actions/profile'
import { ProfileClient } from '@/components/profile/ProfileClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `@${username}`,
    description: `${username}'s Playground profile`,
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const [fullProfile, { data: { user: authUser } }] = await Promise.all([
    getProfileByUsername(username),
    supabase.auth.getUser(),
  ])

  if (!fullProfile) notFound()

  return (
    <ProfileClient
      fullProfile={fullProfile}
      isOwner={authUser?.id === fullProfile.profile.id}
      currentUserId={authUser?.id ?? null}
    />
  )
}
