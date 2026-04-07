var CACHE_NAME = 'ck-v1';
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/static/manifest.json',
  '/static/images/favicon.png',
  '/static/images/icon-192.png',
  '/static/images/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  if (url.origin !== location.origin) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  if (e.request.url.match(/\.(woff2?|ttf|otf|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(resp) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          return resp;
        });
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(function(resp) {
      var clone = resp.clone();
      caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
      return resp;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
