'use client'

import { useState, useEffect } from 'react'

export default function GdprBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(!localStorage.getItem('gdpr-consent'))
  }, [])

  const accept = () => {
    localStorage.setItem('gdpr-consent', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-700 p-4 text-sm text-white">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="m-0">
          We use cookies &amp; analytics to improve your experience. By continuing you consent.
        </p>
        <button
          onClick={accept}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium"
        >
          Accept
        </button>
      </div>
    </div>
  )
}
