import { prisma } from "~/lib/db.server";
import webpush from "web-push";

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject =
  process.env.VAPID_SUBJECT ?? "mailto:admin@komikstream.space";

export const pushEnabled = Boolean(vapidPublic && vapidPrivate);

export async function subscribeUser(
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
) {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth },
    create: { userId, endpoint, p256dh, auth },
  });
  return { ok: true };
}

export async function unsubscribeUser(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  return { ok: true };
}

export async function sendNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body?: string; icon?: string; url?: string },
) {
  if (!pushEnabled) throw new Error("PUSH_DISABLED");
  webpush.setVapidDetails(vapidSubject, vapidPublic!, vapidPrivate!);
  return webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload),
  );
}
