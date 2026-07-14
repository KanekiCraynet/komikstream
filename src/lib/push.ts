import webpush from 'web-push'

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@komikstream.space'

export const pushEnabled = Boolean(vapidPublic && vapidPrivate)

export function getVapidPublicKey(): string {
  if (!vapidPublic) throw new Error('VAPID keys not configured')
  return vapidPublic
}

/** Init web-push once. Safe to call multiple times. */
export function initPush() {
  if (!pushEnabled) return
  webpush.setVapidDetails(vapidSubject, vapidPublic!, vapidPrivate!)
}

export async function sendNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body?: string; icon?: string; url?: string },
) {
  initPush()
  return webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload),
  )
}
