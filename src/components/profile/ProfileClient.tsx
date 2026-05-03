// src/components/profile/ProfileClient.tsx
'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Zap, Music, Video, Palette, TrendingUp, Users, Settings,
  Youtube, ExternalLink, ArrowLeft, ChevronRight, Trophy,
  CheckCircle2, XCircle, Flame,
} from 'lucide-react'
import { cn, formatVP, formatRelativeTime, getReleaseTypeIcon } from '@/lib/utils'
import { toggleFollow, logout } from '@/lib/actions/auth'
import { toast } from 'sonner'
import type { FullProfile } from '@/lib/actions/profile'
import type { Release, PointTransaction } from '@/types/database'

type Tab = 'releases' | 'stats' | 'history'

interface ProfileClientProps {
  fullProfile: FullProfile
  isOwner: boolean
  currentUserId: string | null
}

const TX_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  earn_checkin:      { label: 'Daily check-in',     color: 'text-orange-400', sign: '+' },
  earn_minigame:     { label: 'Mini game reward',   color: 'text-vibe-400',   sign: '+' },
  earn_tip_received: { label: 'Tip received',       color: 'text-vibe-400',   sign: '+' },
  spend_prediction:  { label: 'Prediction placed',  color: 'text-plasma-400', sign: '−' },
  spend_tip_sent:    { label: 'Tip sent',           color: 'text-zinc-400',   sign: '−' },
  refund_prediction: { label: 'Prediction refund',  color: 'text-blue-400',   sign: '+' },
  reward_prediction: { label: 'Prediction won!',    color: 'text-yellow-400', sign: '+' },
  admin_grant:       { label: 'Admin grant',        color: 'text-zinc-400',   sign: '+' },
}

export function ProfileClient({ fullProfile, isOwner, currentUserId }: ProfileClientProps) {
  const router = useRouter()
  const { profile, releases, follower_count, following_count, is_following,
    transaction_history, total_tips_received, total_predictions, correct_predictions } = fullProfile

  const [activeTab, setActiveTab] = useState<Tab>('releases')
  const [following, setFollowing] = useState(is_following)
  const [followerCount, setFollowerCount] = useState(follower_count)
  const [isPending, startTransition] = useTransition()

  const accuracy = total_predictions > 0
    ? Math.round((correct_predictions / total_predictions) * 100)
    : 0

  function handleFollow() {
    if (!currentUserId) { router.push('/login'); return }
    startTransition(async () => {
      const res = await toggleFollow(profile.id)
      if (res.success) {
        setFollowing(res.following)
        setFollowerCount(prev => res.following ? prev + 1 : prev - 1)
        toast(res.following ? `Following @${profile.username}` : `Unfollowed @${profile.username}`)
      }
    })
  }

  function handleLogout() {
    startTransition(async () => { await logout() })
  }

  const typeIcons = { music: Music, video: Video, digital_art: Palette }

  return (
    <div className="max-w-lg mx-auto min-h-dvh">
      {/* Header bar */}
      <header className="sticky top-0 z-40">
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60" />
        <div className="relative flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-bold text-zinc-100 flex-1 truncate">
            @{profile.username}
          </span>
          {isOwner && (
            <Link
              href="/settings"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero section */}
      <div className="relative">
        {/* Cover gradient */}
        <div
          className="h-28 w-full"
          style={{
            background: profile.is_artist
              ? 'linear-gradient(135deg, #0d2e0d 0%, #0e0e10 60%, #1a0a2e 100%)'
              : 'linear-gradient(135deg, #1a0a2e 0%, #0e0e10 60%, #0d1a2e 100%)',
          }}
        />

        {/* Avatar */}
        <div className="absolute left-4 -bottom-0 translate-y-1/2">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-zinc-950 bg-zinc-800">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.username}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400 bg-gradient-to-br from-zinc-800 to-zinc-900">
                  {(profile.display_name ?? profile.username)[0].toUpperCase()}
                </div>
              )}
            </div>
            {/* Role badge */}
            {profile.is_artist && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-vibe-500 border-2 border-zinc-950 flex items-center justify-center">
                <Music className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute right-4 bottom-3 flex items-center gap-2">
          {isOwner ? (
            <>
              <Link
                href="/settings"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-all"
              >
                Edit profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                Sign out
              </button>
            </>
          ) : currentUserId ? (
            <button
              onClick={handleFollow}
              disabled={isPending}
              className={cn(
                'px-5 py-2 rounded-xl text-sm font-medium transition-all active:scale-95',
                following
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-red-500/40 hover:text-red-400'
                  : 'bg-vibe-500 text-white hover:bg-vibe-400',
              )}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          ) : (
            <Link href="/login" className="btn-primary py-2 text-sm">Follow</Link>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pt-14 pb-4">
        <h1 className="font-display font-bold text-xl text-zinc-100">
          {profile.display_name ?? profile.username}
        </h1>
        <p className="text-sm text-zinc-500">@{profile.username}</p>

        {profile.bio && (
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{profile.bio}</p>
        )}

        {/* Social links */}
        <div className="flex items-center gap-3 mt-2">
          {profile.youtube_channel_id && (
            <a
              href={`https://youtube.com/channel/${profile.youtube_channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Youtube className="w-3.5 h-3.5" />
              YouTube
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {profile.soundcloud_username && (
            <a
              href={`https://soundcloud.com/${profile.soundcloud_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              SoundCloud
            </a>
          )}
        </div>

        {/* Role pills */}
        <div className="flex items-center gap-2 mt-3">
          {profile.is_artist && (
            <span className="type-pill bg-vibe-500/10 text-vibe-400 border border-vibe-500/20">
              <Music className="w-3 h-3" /> Artist
            </span>
          )}
          {profile.is_bettor && (
            <span className="type-pill bg-plasma-500/10 text-plasma-400 border border-plasma-500/20">
              <TrendingUp className="w-3 h-3" /> Bettor
            </span>
          )}
        </div>

        {/* Follower / VP stats row */}
        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-zinc-800/60">
          <button className="flex flex-col items-center text-center">
            <span className="font-display font-bold text-lg text-zinc-100">{followerCount}</span>
            <span className="text-xs text-zinc-500">Followers</span>
          </button>
          <button className="flex flex-col items-center text-center">
            <span className="font-display font-bold text-lg text-zinc-100">{following_count}</span>
            <span className="text-xs text-zinc-500">Following</span>
          </button>
          <div className="ml-auto">
            <div className="vp-badge py-1.5 px-3 text-sm">
              <Zap className="w-4 h-4" />
              {formatVP(profile.vibe_points)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/40">
        <div className="flex px-4">
          {([
            { id: 'releases', label: 'Releases', count: releases.length },
            { id: 'stats',    label: 'Stats',    count: null },
            { id: 'history',  label: isOwner ? 'VP History' : null, count: null },
          ] as const).map(tab => {
            if (!tab.label) return null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-1.5 px-1 py-3.5 mr-6 text-sm font-medium border-b-2 transition-all',
                  activeTab === tab.id
                    ? 'border-vibe-400 text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300',
                )}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    activeTab === tab.id ? 'bg-vibe-500/20 text-vibe-400' : 'bg-zinc-800 text-zinc-500',
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4 pb-8">
        {/* ── Releases ── */}
        {activeTab === 'releases' && (
          <div className="space-y-3">
            {isOwner && (
              <Link
                href="/create-release"
                className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-zinc-700/60 hover:border-vibe-500/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <span className="text-2xl">+</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">New release</p>
                  <p className="text-xs text-zinc-600">Music, video, or digital art</p>
                </div>
              </Link>
            )}

            {releases.map(release => {
              const Icon = typeIcons[release.type] ?? Music
              return (
                <Link key={release.id} href={`/releases/${release.id}`}>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                    {/* Cover */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                      {release.cover_image_url ? (
                        <Image
                          src={release.cover_image_url}
                          alt={release.title}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-zinc-100 truncate">{release.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {getReleaseTypeIcon(release.type)}{' '}
                        {formatRelativeTime(release.released_at ?? release.created_at)}
                      </p>
                    </div>
                    {/* Tip total */}
                    {release.tip_total > 0 && (
                      <div className="vp-badge flex-shrink-0">
                        <Zap className="w-3 h-3" />
                        {formatVP(release.tip_total)}
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                  </div>
                </Link>
              )
            })}

            {releases.length === 0 && (
              <div className="py-12 text-center">
                <Music className="w-12 h-12 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
                <p className="text-zinc-500 text-sm">No releases yet</p>
                {isOwner && (
                  <Link href="/create-release" className="btn-primary mt-4 inline-flex">
                    Create your first release
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* VP breakdown */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-vibe-950/60 to-zinc-900 border border-vibe-900/40">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Vibe Points</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-4xl text-vibe-400 tabular-nums">
                  {formatVP(profile.vibe_points)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {formatVP(total_tips_received)} received in tips
              </p>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: TrendingUp,
                  label: 'Predictions',
                  value: total_predictions,
                  sub: `${accuracy}% accuracy`,
                  color: 'text-plasma-400',
                  bg: 'bg-plasma-500/10 border-plasma-500/15',
                },
                {
                  icon: Trophy,
                  label: 'Correct',
                  value: correct_predictions,
                  sub: `of ${total_predictions} total`,
                  color: 'text-yellow-400',
                  bg: 'bg-yellow-500/10 border-yellow-500/15',
                },
                {
                  icon: Music,
                  label: 'Releases',
                  value: releases.length,
                  sub: 'published',
                  color: 'text-vibe-400',
                  bg: 'bg-vibe-500/10 border-vibe-500/15',
                },
                {
                  icon: Users,
                  label: 'Followers',
                  value: followerCount,
                  sub: `${following_count} following`,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/15',
                },
              ].map(({ icon: Icon, label, value, sub, color, bg }) => (
                <div key={label} className={cn('p-4 rounded-2xl border', bg)}>
                  <Icon className={cn('w-5 h-5 mb-2', color)} />
                  <p className={cn('font-display font-bold text-2xl', color)}>{value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Prediction accuracy bar */}
            {total_predictions > 0 && (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-zinc-300">Prediction accuracy</p>
                  <span className="font-mono font-bold text-sm text-plasma-400">{accuracy}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-plasma-600 to-plasma-400 transition-all duration-700"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-600 mt-1.5">
                  <span>{correct_predictions} correct</span>
                  <span>{total_predictions - correct_predictions} wrong</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VP History (owner only) ── */}
        {activeTab === 'history' && isOwner && (
          <div className="space-y-2">
            {transaction_history.length === 0 && (
              <div className="py-12 text-center">
                <Zap className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No transactions yet</p>
                <p className="text-xs text-zinc-600 mt-1">Play mini games or tip a release to get started</p>
              </div>
            )}

            {transaction_history.map(tx => {
              const cfg = TX_CONFIG[tx.type] ?? { label: tx.type, color: 'text-zinc-400', sign: '' }
              const isPositive = tx.amount > 0

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60"
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    isPositive ? 'bg-vibe-500/10' : 'bg-zinc-800',
                  )}>
                    {isPositive
                      ? <Zap className="w-4 h-4 text-vibe-400" />
                      : <TrendingUp className="w-4 h-4 text-zinc-500" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{cfg.label}</p>
                    <p className="text-xs text-zinc-600">
                      {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>

                  {/* Amount */}
                  <span className={cn('font-mono font-bold text-sm', cfg.color)}>
                    {cfg.sign}{Math.abs(tx.amount)} VP
                  </span>
                </div>
              )
            })}

            {transaction_history.length >= 20 && (
              <p className="text-center text-xs text-zinc-600 pt-2">
                Showing last 20 transactions
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
