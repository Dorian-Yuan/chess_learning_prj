/* 国际象棋研习 — 手写 Service Worker（离线完整可用，相对路径适配任意部署子路径） */
const CACHE_NAME = 'chess-learning-v12';

/* 首次安装即预缓存的静态资源（相对 sw 脚本所在目录解析，兼容 GitHub Pages 子路径与本地根路径） */
const PRECACHE_URLS = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.webmanifest',
  './assets/logo/logo.png',
  './assets/logo/logo.svg',
  './assets/logo/favicon.png',
  './assets/logo/icon-180.png',
  './assets/logo/icon-192.png',
  './assets/logo/icon-512.png',
  './assets/logo/icon-maskable-512.png',
  './engine/stockfish.js',
  './engine/stockfish.wasm',
  './assets/pieces/wP.svg',
  './assets/pieces/wN.svg',
  './assets/pieces/wB.svg',
  './assets/pieces/wR.svg',
  './assets/pieces/wQ.svg',
  './assets/pieces/wK.svg',
  './assets/pieces/bP.svg',
  './assets/pieces/bN.svg',
  './assets/pieces/bB.svg',
  './assets/pieces/bR.svg',
  './assets/pieces/bQ.svg',
  './assets/pieces/bK.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // SPA 导航请求：返回缓存的 index.html（离线可整页刷新）
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        });
      })
    );
    return;
  }

  // 其余静态资源：缓存优先，未命中回源并写入缓存
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});