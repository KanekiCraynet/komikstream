'use client'

import { useState, useEffect, useCallback } from 'react'

const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function getExistingSubscription(): Promise<PushSubscriptionJSON | null> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub ? sub.toJSON() : null
}

export default function PushNotificationToggle() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const ok = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && !!vapidKey
    setSupported(ok)
    if (!ok) { setLoading(false); return }

    navigator.serviceWorker.register('/sw.js').then(() =>
      getExistingSubscription(),
    ).then((sub) => {
      setSubscribed(!!sub)
    }).finally(() => setLoading(false))
  }, [])

  const toggle = useCallback(async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()

      if (existing) {
        await existing.unsubscribe()
        await fetch('/api/push/unsubscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        })
        setSubscribed(false)
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        const json = sub.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        })
        setSubscribed(true)
      }
    } catch (e) {
      console.error('Push toggle failed', e)
      if ((e as Error).message.includes('Permission denied')) setSubscribed(false)
    }
    setLoading(false)
  }, [])

  if (!supported) return null

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm">Push Notifications</p>
        <p className="text-xs text-gray-500">{subscribed ? 'Notifications enabled' : 'Get notified for new chapters'}</p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`px-4 py-2 rounded text-sm disabled:opacity-50 ${
          subscribed ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-blue-700 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? '...' : subscribed ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}
