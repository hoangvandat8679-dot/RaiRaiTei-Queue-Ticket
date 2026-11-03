/**
 * RaiRaiTei Queue Ticket Studio — Service Worker (GĐ4 vé 4.2)
 * Chiến lược: stale-while-revalidate cho mọi tài nguyên cùng nguồn —
 * app mở được ngay cả khi mất mạng (dùng bản cache), đồng thời tự nạp
 * bản mới ở nền cho lần mở sau. Khi có bản SW mới đang chờ, trang hiển
 * thị banner "Đã có bản mới — Nạp lại" thay vì tự đổi giữa ca làm.
 * Tên cache có phiên bản: bản mới tạo cache mới, bản cũ bị dọn ở activate.
 */
const CACHE_NAME = 'rairaitei-shell-v7';
const PRECACHE = ["./","assets/images/mascot.png","assets/images/templates/spring-background.png","assets/images/templates/spring-branch-ribbon.png","assets/images/templates/spring-number-frame.png","assets/images/templates/thumbs/autumn.webp","assets/images/templates/thumbs/spring.webp","assets/images/templates/thumbs/summer.webp","assets/images/templates/thumbs/winter.webp","assets/templates/autumn.svg","assets/templates/summer.svg","assets/templates/winter.svg","css/fonts.css","css/layout.css","css/main.css","css/print.css","css/tailwind.css","css/templates.css","css/ticket-drag.css","css/ticket.css","css/tokens/colors.css","css/tokens/dimensions.css","css/tokens/index.css","css/tokens/typography.css","index.html","js/app.js","js/controls.js","js/core/signal.js","js/core/store.js","js/design-history.js","js/i18n.js","js/image-editor.js","js/in-app-guard.js","js/layout-sync.js","js/print/cropmarks.js","js/print/layout.js","js/print/preflight.js","js/print/print-mobile.js","js/print/print-pc.js","js/print/print.js","js/print/raster.js","js/registry/template-registry.js","js/registry/templates/autumn.js","js/registry/templates/spring.js","js/registry/templates/standard.js","js/registry/templates/summer.js","js/registry/templates/winter.js","js/state-schema.js","js/storage/draft-manager.js","js/storage/preset-manager.js","js/ticket-drag.js","js/ui-events.js","js/vendor/html-to-image.min.js","js/vendor/html2canvas.min.js","js/vendor/jspdf.umd.min.js"];

self.addEventListener('install', (event) => {
  // Nạp từng tệp riêng lẻ: cache.addAll là nguyên tử — chỉ một URL lỗi
  // là toàn bộ vỏ offline chết theo. Tệp nào lỗi thì bỏ qua tệp đó,
  // phần còn lại vẫn dùng được khi mất mạng.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(PRECACHE.map((url) =>
        // cache:'reload' — bỏ qua HTTP cache của GitHub Pages (max-age
        // 600 giây) để bản mới không nạp nhầm tệp của bản cũ ngay sau deploy.
        cache.add(new Request(url, { cache: 'reload' })).catch((err) => console.warn('[SW] Bỏ qua tệp không nạp được:', url, err))
      )))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) {
        event.waitUntil(network.catch(() => {}));
        return cached;
      }
      const fresh = await network;
      if (fresh) return fresh;
      if (req.mode === 'navigate') {
        const shell = await cache.match('index.html', { ignoreSearch: true });
        if (shell) return shell;
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
