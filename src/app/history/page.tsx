'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { listHistory, deleteHistory, clearHistory } from '@/lib/actions/history'

export default function HistoryPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listHistory>>['items']>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await listHistory(page, limit)
      setItems(res.items)
      setTotal(res.total)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="p-4 text-center text-gray-400">Loading...</div>
  if (error) return <div className="p-4 text-center text-red-400">Failed to load history. <button onClick={load} className="underline">Retry</button></div>

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">History</h1>
        <p className="text-gray-400">No reading history yet.</p>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">History ({total})</h1>
        <button onClick={() => clearHistory().then(load)} className="text-sm text-red-400 hover:text-red-300">
          Clear all
        </button>
      </div>
      <div className="space-y-2">
        {items.map((h) => (
          <div key={h.id} className="flex items-center justify-between bg-neutral-900 rounded p-3">
            <Link href={`/komik/${h.contentId}`} className="hover:text-blue-400 truncate">
              {h.contentId} — page {h.lastPage}
            </Link>
            <button aria-label={`Delete history ${h.contentId}`} onClick={() => deleteHistory(h.contentId).then(load)} className="text-sm text-red-400 hover:text-red-300 shrink-0 ml-2">
              Delete
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-center mt-4">
        <button disabled={page <= 1} onClick={() => setPage(p => p-1)} className="px-3 py-1 bg-neutral-800 rounded disabled:opacity-40">Prev</button>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1 bg-neutral-800 rounded disabled:opacity-40">Next</button>
      </div>
    </main>
  )
}
