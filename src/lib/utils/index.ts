// src/lib/utils/index.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVP(points: number): string {
  if (points >= 1_000_000) return `${(points / 1_000_000).toFixed(1)}M VP`
  if (points >= 1_000) return `${(points / 1_000).toFixed(1)}K VP`
  return `${points} VP`
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function getReleaseTypeIcon(type: string): string {
  const icons = { music: '🎵', video: '🎬', digital_art: '🎨' }
  return icons[type as keyof typeof icons] ?? '🎭'
}

export function getReleaseTypeLabel(type: string): string {
  const labels = { music: 'Music', video: 'Video', digital_art: 'Digital Art' }
  return labels[type as keyof typeof labels] ?? type
}

export function getMarketStatusColor(status: string): string {
  const colors = {
    open: 'text-vibe-400',
    closed: 'text-yellow-400',
    resolved: 'text-plasma-400',
    cancelled: 'text-zinc-500',
  }
  return colors[status as keyof typeof colors] ?? 'text-zinc-400'
}

export function calculateOdds(optionBets: number, totalPool: number): string {
  if (totalPool === 0) return '—'
  const pct = (optionBets / totalPool) * 100
  return `${pct.toFixed(1)}%`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  )
  return match?.[1] ?? null
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url)
  if (!id) return null
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}
