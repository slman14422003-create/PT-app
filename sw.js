// AST-2012A Clinical Master Pro - Service Worker v2.0
const CACHE_NAME = 'ast-2012a-v2.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// تثبيت Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache error:', error);
      })
  );
});

// تفعيل Service Worker وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Activation error:', error);
      })
  );
});

// استراتيجية التخزين المؤقت: Cache First ثم الشبكة
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات التحليلات والإحصائيات
  if (event.request.url.includes('google-analytics') || 
      event.request.url.includes('analytics')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // إذا كان الملف موجوداً في الكاش، نعيده
        if (cachedResponse) {
          return cachedResponse;
        }

        // وإلا، نطلب من الشبكة
        return fetch(event.request)
          .then((response) => {
            // نتحقق من صحة الاستجابة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // نسخ الاستجابة لتخزينها
            const responseToCache = response.clone();
            
            // نفتح الكاش ونخزن الاستجابة
            caches.open(CACHE_NAME)
              .then((cache) => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.warn('[SW] Could not cache:', event.request.url, error);
                }
              });

            return response;
          })
          .catch(() => {
            // في حالة عدم وجود اتصال، نقدم صفحة بديلة
            return caches.match('/offline.html');
          });
      })
  );
});

// التعامل مع الرسائل من العميل
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// تحديث التطبيق في الخلفية
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(ASSETS_TO_CACHE);
        })
    );
  }
});

// دعم دفع الإشعارات (اختياري)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="100" fill="%230b0f19"/%3E%3Ccircle cx="256" cy="256" r="180" fill="none" stroke="%2338bdf8" stroke-width="24"/%3E%3Cpath d="M256 76 L256 436 M436 256 L76 256" stroke="%2338bdf8" stroke-width="24" stroke-linecap="round"/%3E%3Ccircle cx="256" cy="256" r="60" fill="%2338bdf8"/%3E%3Cpath d="M180 180 L332 332 M332 180 L180 332" stroke="%230b0f19" stroke-width="20" stroke-linecap="round"/%3E%3Ctext x="256" y="490" text-anchor="middle" font-family="Arial" font-size="40" fill="%2338bdf8" font-weight="bold"%3EAST%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="100" fill="%2338bdf8"/%3E%3Ctext x="256" y="340" text-anchor="middle" font-family="Arial" font-size="200" fill="%230b0f19"%3E⚕%3C/text%3E%3C/svg%3E',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'استعراض',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%2338bdf8" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/%3E%3C/svg%3E'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AST-2012A Clinical Master', options)
  );
});

// التعامل مع نقر الإشعارات
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
