// Service worker do Energy Based Planner: deixa o app instalável e funcionando sem internet.
//
// Estratégia (pensada para quem edita o código):
//  - Arquivos do próprio app: SEMPRE tenta a internet primeiro (você vê suas edições na hora)
//    e só usa a cópia guardada se estiver sem conexão.
//  - Fontes do app (pasta fonts/): cópia guardada primeiro (os arquivos nunca mudam).
//
// Se algum dia o navegador parecer mostrar uma versão antiga, aumente o número em VERSION.

const VERSION = 'v2';
const CACHE = `energy-planner-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const cacheable = (res) => res && (res.ok || res.type === 'opaque');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;

  // Fontes do app: cópia guardada primeiro, só busca na internet na primeira vez
  if (url.origin === self.location.origin && url.pathname.includes('/fonts/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (cacheable(res)) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Do próprio app: internet primeiro, cópia guardada como reserva
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req, req.mode === 'navigate' ? undefined : { cache: 'no-cache' });
        if (cacheable(res)) cache.put(req, res.clone());
        return res;
      } catch (err) {
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        if (req.mode === 'navigate') {
          const home = (await cache.match('index.html')) || (await cache.match('./'));
          if (home) return home;
        }
        throw err;
      }
    })());
    return;
  }

  // De outros sites (ex.: fontes de comparação do guia de estilo): cópia guardada primeiro, atualiza em segundo plano
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const update = fetch(req).then((res) => { if (cacheable(res)) cache.put(req, res.clone()); return res; }).catch(() => null);
    return cached || (await update) || Response.error();
  })());
});
