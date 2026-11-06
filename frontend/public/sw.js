/*
 * IA Coran service worker — fast repeat visits on slow connections.
 *  - API calls and recitation audio always go to the network (never cached).
 *  - Pages: network first, cached copy when offline.
 *  - Hashed build assets, fonts and icons: cache first (their URL changes when they change).
 */
const CACHE = 'iacoran-v1'
const SHELL = ['/', '/manifest.webmanifest', '/mark.svg', '/logo.svg', '/fonts/harmattan-arabic-400.woff2', '/fonts/amiri-salawat.woff2']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  if (/^\/(assets|fonts)\/|\.(svg|png|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      }))
    )
  }
})
