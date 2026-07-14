'use client'

const STORE_KEY = 'komikstream_progress'
const MAX_ENTRIES_GUEST = 100

export interface GuestProgress {
  chapterId: string
  page: number
  updatedAt: string
}

function load(): GuestProgress[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(list: GuestProgress[]) {
  const tail = list.slice(-MAX_ENTRIES_GUEST)
  localStorage.setItem(STORE_KEY, JSON.stringify(tail))
}

export function getChapterPage(chapterId: string): number {
  const entry = load().find((e) => e.chapterId === chapterId)
  return entry?.page ?? 0
}

export function setChapterPage(chapterId: string, page: number) {
  const list = load().filter((e) => e.chapterId !== chapterId)
  list.push({ chapterId, page, updatedAt: new Date().toISOString() })
  save(list)
}

export function allProgress(): GuestProgress[] {
  return load()
}