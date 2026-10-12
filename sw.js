/* Service worker: Pembuat Akun. Naikkan nomor V setiap kali file diganti. */
const V = 'pembuat-akun-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('pembuat-akun-') && k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);

  // Halaman: coba jaringan dulu supaya selalu versi terbaru, cadangan dari cache saat offline
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); }
        return res;
      }).catch(() => caches.match('./index.html').then(m => m || caches.match('./')))
    );
    return;
  }

  // File sendiri (ikon, manifest): cache dulu
  if (u.origin === location.origin) {
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }))
    );
    return;
  }

  // Font Google: tampilkan dari cache, perbarui di belakang layar
  if (FONT_HOSTS.includes(u.hostname)) {
    e.respondWith(
      caches.open(V).then(c => c.match(r).then(m => {
        const net = fetch(r).then(res => {
          if (res.ok || res.type === 'opaque') c.put(r, res.clone());
          return res;
        }).catch(() => m);
        return m || net;
      }))
    );
  }
});
