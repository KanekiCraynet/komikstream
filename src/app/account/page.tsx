'use client'

import { useState, useEffect } from 'react'
import { getPreferences, updatePreferences, deleteAccount } from '@/lib/actions/account'
import { cancelSubscription, getSubscriptionStatus } from '@/lib/actions/subscription'
import PushNotificationToggle from '@/components/PushNotificationToggle'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const [prefs, setPrefs] = useState<Awaited<ReturnType<typeof getPreferences>>>(null)
  const [sub, setSub] = useState<Awaited<ReturnType<typeof getSubscriptionStatus>>>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      getPreferences(),
      getSubscriptionStatus(),
    ]).then(([p, s]) => {
      setPrefs(p)
      setSub(s)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-center text-gray-400">Loading...</div>
  if (!prefs) return <main className="max-w-xl mx-auto p-4"><h1 className="text-xl font-bold">Account</h1><p className="text-gray-400 mt-2">Sign in to manage preferences.</p></main>

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/subscription/create', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } catch {}
    setUpgrading(false)
  }

  const handleCancel = async () => {
    if (!confirm('Cancel subscription? Premium access ends immediately.')) return
    setCancelling(true)
    await cancelSubscription()
    setSub({ tier: 'free', subscription: null })
    setCancelling(false)
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">Account</h1>
      <p className="text-sm text-gray-400">Email: {prefs.email}</p>

      <section>
        <h2 className="text-lg font-semibold mb-2">Subscription</h2>
        <p className="text-sm text-gray-400">Tier: <span className={sub?.tier === 'premium' ? 'text-yellow-400 font-semibold' : ''}>{sub?.tier ?? 'free'}</span></p>
        {sub?.subscription?.endsAt && (
          <p className="text-xs text-gray-500">
            {sub.subscription.status === 'grace' ? 'Grace period until' : 'Expires'}: {new Date(sub.subscription.endsAt).toLocaleDateString()}
          </p>
        )}
        {sub?.tier === 'free' ? (
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm disabled:opacity-50"
          >
            {upgrading ? 'Redirecting...' : 'Upgrade to Premium — IDR 29,000/mo'}
          </button>
        ) : (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
        )}
      </section>

      <section className="border-t border-neutral-700 pt-4">
        <PushNotificationToggle />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Preferences</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm">Theme</span>
            <select
              defaultValue={(prefs.preferences as Record<string,string> | null)?.theme ?? 'dark'}
              className="block w-full mt-1 bg-neutral-800 rounded p-2 text-sm"
              onChange={async (e) => {
                setSaving(true)
                await updatePreferences({ ...prefs.preferences as Record<string,string>, theme: e.target.value })
                setSaving(false)
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
        </div>
        {saving && <p className="text-xs text-gray-500 mt-1">Saving...</p>}
      </section>

      <section className="border-t border-neutral-700 pt-4">
        <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
        <button
          onClick={async () => {
            if (!confirm('Delete your account and all data permanently?')) return
            await deleteAccount()
            router.push('/')
          }}
          className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
        >
          Delete Account
        </button>
      </section>
    </main>
  )
}
