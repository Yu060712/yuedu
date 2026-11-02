const CACHE_NAME = 'yuedu-workbench-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install: 预缓存核心资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

// Activate: 清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: 缓存优先 + 网络兜底 + 导航离线回退
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    // 导航请求离线回退到 index.html
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(req).then(cached => {
            const networkFetch = fetch(req).then(resp => {
                if (resp && resp.status === 200 && resp.type === 'basic') {
                    const clone = resp.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
                }
                return resp;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
});
