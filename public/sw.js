/* Keplix Partner service worker — Web Push only. It does no caching and no
 * offline work: its one job is to show a booking alert when the browser
 * delivers a push, including while every portal tab is closed.
 *
 * Push payload (JSON, from keplix-backend util/notificationHelper.js):
 *   { title, body, tag, url, urgent }
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Keplix Partner', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Keplix Partner';
  const options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    // Same tag => the newest alert replaces the old one, and renotify makes it
    // sound again. Also de-duplicates against the tab's own desktop notification.
    tag: data.tag || 'keplix',
    renotify: true,
    requireInteraction: Boolean(data.urgent),
    data: { url: data.url || '/bookings' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/bookings';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Reuse an open portal tab rather than piling up new ones.
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus().then((c) => ('navigate' in c ? c.navigate(url) : c));
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
