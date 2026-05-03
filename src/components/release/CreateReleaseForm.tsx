// src/components/release/CreateReleaseForm.tsx
'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Music, Video, Palette, Youtube, Cloud, Upload,
  X, Loader2, Sparkles, Eye, Save,
} from 'lucide-react'
import { cn, extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils'
import { createRelease } from '@/lib/actions/release'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Max 120 characters'),
  type: z.enum(['music', 'video', 'digital_art']),
  description: z.string().max(500).optional(),
  link_youtube: z.string().url('Must be a valid YouTube URL').optional().or(z.literal('')),
  link_soundcloud: z.string().url('Must be a valid SoundCloud URL').optional().or(z.literal('')),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
})

type FormValues = z.infer<typeof schema>

const RELEASE_TYPES = [
  {
    id: 'music' as const,
    icon: Music,
    label: 'Music',
    desc: 'Song, EP, Album',
    gradient: 'from-vibe-500/20 to-vibe-600/10',
    border: 'border-vibe-500/40',
    active: 'border-vibe-500 bg-vibe-500/10',
    text: 'text-vibe-400',
  },
  {
    id: 'video' as const,
    icon: Video,
    label: 'Video',
    desc: 'MV, Short, Live',
    gradient: 'from-plasma-500/20 to-plasma-600/10',
    border: 'border-plasma-500/40',
    active: 'border-plasma-500 bg-plasma-500/10',
    text: 'text-plasma-400',
  },
  {
    id: 'digital_art' as const,
    icon: Palette,
    label: 'Digital Art',
    desc: 'Visual, Concept, NFT',
    gradient: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/40',
    active: 'border-amber-500 bg-amber-500/10',
    text: 'text-amber-400',
  },
]

export function CreateReleaseForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'music',
      status: 'published',
      title: '',
      description: '',
      link_youtube: '',
      link_soundcloud: '',
      cover_image_url: '',
    },
  })

  const watchedType = form.watch('type')
  const watchedYT = form.watch('link_youtube')
  const watchedTitle = form.watch('title')

  // Auto-preview YouTube thumbnail when URL is entered
  const ytThumbnail = watchedYT ? getYouTubeThumbnail(watchedYT) : null

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCoverPreview(url)
    // In production: upload via server action, set URL
    // For now, show preview only
  }

  function onSubmit(values: FormValues, status: 'draft' | 'published') {
    startTransition(async () => {
      const result = await createRelease({ ...values, status })
      if (result.success) {
        toast.success(
          status === 'published' ? 'Release published! 🎉' : 'Saved as draft',
        )
        router.push(status === 'published' ? '/' : '/profile')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Something went wrong')
      }
    })
  }

  const activeType = RELEASE_TYPES.find(t => t.id === watchedType)!

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-3">
          What are you releasing?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {RELEASE_TYPES.map(type => {
            const Icon = type.icon
            const isSelected = watchedType === type.id
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => form.setValue('type', type.id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2',
                  'transition-all duration-200 active:scale-95',
                  isSelected
                    ? type.active
                    : 'border-zinc-800 hover:border-zinc-700',
                )}
              >
                <Icon className={cn('w-6 h-6', isSelected ? type.text : 'text-zinc-600')} />
                <div className="text-center">
                  <div className={cn(
                    'text-xs font-bold',
                    isSelected ? 'text-zinc-100' : 'text-zinc-500',
                  )}>
                    {type.label}
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{type.desc}</div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vibe-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-3">Cover</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative w-full aspect-video rounded-2xl border-2 border-dashed overflow-hidden',
            'transition-all duration-200',
            coverPreview || ytThumbnail
              ? 'border-zinc-700'
              : 'border-zinc-800 hover:border-zinc-600',
          )}
        >
          {(coverPreview ?? ytThumbnail) ? (
            <>
              <Image
                src={coverPreview ?? ytThumbnail!}
                alt="Cover preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-2',
              'bg-gradient-to-br',
              activeType.gradient,
            )}>
              <Upload className="w-8 h-8 text-zinc-600" />
              <span className="text-sm text-zinc-500">Upload cover image</span>
              <span className="text-xs text-zinc-600">or paste a YouTube URL below</span>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          {...form.register('title')}
          placeholder={
            watchedType === 'music' ? 'Song title...' :
            watchedType === 'video' ? 'Video title...' :
            'Artwork title...'
          }
          className="input-glass w-full font-display text-xl font-bold"
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-xs text-red-400">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          Description
          <span className="text-zinc-600 font-normal ml-2">
            {form.watch('description')?.length ?? 0}/500
          </span>
        </label>
        <textarea
          {...form.register('description')}
          placeholder="Tell people about this release..."
          rows={3}
          className="input-glass w-full resize-none"
        />
      </div>

      {/* Links section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-400">Links</label>

        {/* YouTube */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Youtube className="w-4 h-4 text-red-500" />
          </div>
          <input
            {...form.register('link_youtube')}
            placeholder="https://youtube.com/watch?v=..."
            className="input-glass w-full pl-10"
          />
          {form.formState.errors.link_youtube && (
            <p className="mt-1 text-xs text-red-400">
              {form.formState.errors.link_youtube.message}
            </p>
          )}
        </div>

        {/* SoundCloud */}
        {(watchedType === 'music') && (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Cloud className="w-4 h-4 text-orange-500" />
            </div>
            <input
              {...form.register('link_soundcloud')}
              placeholder="https://soundcloud.com/..."
              className="input-glass w-full pl-10"
            />
          </div>
        )}
      </div>

      {/* Preview card */}
      {watchedTitle && (
        <div className={cn(
          'p-4 rounded-2xl border',
          'bg-gradient-to-br',
          activeType.gradient,
          'border-zinc-800',
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 font-medium">Preview</span>
          </div>
          <p className={cn('font-display font-bold text-lg', activeType.text)}>
            {watchedTitle}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {RELEASE_TYPES.find(t => t.id === watchedType)?.label}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSubmit(form.getValues(), 'draft')}
          disabled={isPending}
          className="btn-ghost flex-1"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Draft
        </button>
        <button
          type="button"
          onClick={form.handleSubmit(v => onSubmit(v, 'published'))}
          disabled={isPending}
          className="btn-primary flex-1"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Publish
        </button>
      </div>
    </div>
  )
}
