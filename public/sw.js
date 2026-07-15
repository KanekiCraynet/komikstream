self.addEventListener('push', (event) => {
  let data = { title: 'KomikStream', body: '', icon: '/favicon.ico', url: '/' }
  try { data = { ...data, ...event.data?.json() } } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: data.icon, data: { url: data.url },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'))
})
