'use client'

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { setChapterPage, getChapterPage } from '@/lib/progress'
import BannerAd from '@/components/ads/BannerAd'
import InterstitialAd from '@/components/ads/InterstitialAd'

type Mode = 'vertical' | 'horizontal' | 'ltr' | 'rtl'

interface Props {
  chapterId: string
  images: string[]
  tier: 'free' | 'premium'
}

function useStoredPage(chapterId: string) {
  const [page, setPage] = useState(0)
  useEffect(() => {
    setPage(getChapterPage(chapterId))
  }, [chapterId])
  const goTo = useCallback(
    (p: number) => {
      setChapterPage(chapterId, p)
      setPage(p)
    },
    [chapterId],
  )
  return [page, goTo] as const
}

export default function MangaReader({ chapterId, images, tier }: Props) {
  const [page, setPage] = useStoredPage(chapterId)
  const [mode, setMode] = useState<Mode>('vertical')
  const [interstitial, setInterstitial] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPremium = tier === 'premium'

  const advance = useCallback(
    (dir: 1 | -1) => {
      const next = page + dir
      if (next < 0 || next >= images.length) return
      setPage(next)
      if (mode === 'vertical') {
        scrollRef.current
          ?.querySelector<HTMLElement>(`[data-idx="${next}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [page, mode, images.length, setPage],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') advance(mode === 'rtl' ? 1 : -1)
      if (e.key === 'ArrowRight') advance(mode === 'rtl' ? -1 : 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, mode])

  useEffect(() => {
    if (page > 0 && scrollRef.current) {
      const el = scrollRef.current.querySelector<HTMLElement>(`[data-idx="${page}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [page])

  useEffect(() => {
    if (!isPremium && page === images.length - 1) setInterstitial(true)
  }, [page, isPremium, images.length])

  const wrapper = useMemo(() => {
    switch (mode) {
      case 'horizontal':
      case 'ltr':
      case 'rtl':
        return 'flex overflow-x-auto snap-x snap-mandatory'
      default:
        return 'flex flex-col'
    }
  }, [mode])

  const imgStyle = useMemo(() => {
    switch (mode) {
      case 'horizontal':
        return 'max-h-screen w-auto snap-center shrink-0'
      case 'ltr':
      case 'rtl':
        return 'max-h-[80vh] w-auto snap-center shrink-0'
      default:
        return 'w-full'
    }
  }, [mode])

  const items = useMemo(() => {
    if (isPremium) return images.map((url, index) => ({ kind: 'image' as const, url, index }))
    const result: ({ kind: 'image'; url: string; index: number } | { kind: 'ad'; key: string })[] = []
    images.forEach((url, idx) => {
      result.push({ kind: 'image', url, index: idx })
      if ((idx + 1) % 5 === 0 && idx < images.length - 1) {
        result.push({ kind: 'ad', key: `ad-${idx}` })
      }
    })
    return result
  }, [images, isPremium])

  return (
    <div className="relative mx-auto max-w-2xl">
      {interstitial && <InterstitialAd onClose={() => setInterstitial(false)} />}

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 bg-white/90 px-3 py-2 text-sm backdrop-blur dark:bg-gray-900/90">
        <span className="text-gray-600">Hlm {page + 1}/{images.length}</span>

        {(['vertical', 'horizontal', 'ltr', 'rtl'] satisfies Mode[]).map((m) => (
          <button
            key={m}
            aria-label={`Reading mode ${m}`}
            onClick={() => setMode(m)}
            className={`rounded px-2 py-0.5 ${
              mode === m
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {m === 'vertical' ? 'V' : m === 'horizontal' ? 'H' : m === 'ltr' ? '→' : '←'}
          </button>
        ))}

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => advance(-1)}
            aria-label="Previous page"
            disabled={page === 0}
            className="rounded bg-gray-200 px-3 py-0.5 disabled:opacity-30 dark:bg-gray-700"
          >
            ◀
          </button>
          <button
            onClick={() => advance(1)}
            aria-label="Next page"
            disabled={page === images.length - 1}
            className="rounded bg-gray-200 px-3 py-0.5 disabled:opacity-30 dark:bg-gray-700"
          >
            ▶
          </button>
        </div>
      </div>

      <div ref={scrollRef} className={wrapper}>
        {items.map((item) => {
          if (item.kind === 'ad') return <BannerAd key={item.key} className="my-4" />
          return (
            <img
              key={item.index}
              src={item.url}
              alt={`Hlm ${item.index + 1}`}
              className={imgStyle}
              data-idx={item.index}
              loading={item.index < 3 ? 'eager' : 'lazy'}
              onError={(e) => {
                const t = e.currentTarget
                t.style.background = '#eee'
                t.style.minHeight = '200px'
                t.alt = `Gagal muat hlm ${item.index + 1}`
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
