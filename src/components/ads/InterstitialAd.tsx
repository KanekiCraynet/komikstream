'use client'

import { useState, useEffect } from 'react'

export default function InterstitialAd({ onClose }: { onClose: () => void }) {
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-neutral-900 p-6 rounded-lg w-80 text-center">
        <div className="h-48 flex items-center justify-center text-gray-500 mb-4">Ad</div>
        {canClose ? (
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 rounded text-sm">
            Skip
          </button>
        ) : (
          <p className="text-xs text-gray-500">Ad — 5s</p>
        )}
      </div>
    </div>
  )
}
