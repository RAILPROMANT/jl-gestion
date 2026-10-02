// Service worker de la app del encargado: permite abrirla y cargar horas sin internet.
var CACHE = 'jl-encargado-v1';
var PRECACHE = [
  'encargado.html',
  'manifest-encargado.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) {
    return Promise.all(PRECACHE.map(function(u) {
      var req = u.indexOf('http') === 0 ? new Request(u, { mode: 'no-cors' }) : u;
      return fetch(req).then(function(r) { return c.put(u, r); }).catch(function() {});
    }));
  }).then(function() { return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k.indexOf('jl-encargado-') === 0 && k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
});

function esPaginaEncargado(url) {
  return url.origin === self.location.origin && /\/encargado(\.html)?$/.test(url.pathname);
}

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (esPaginaEncargado(url)) {
    e.respondWith(
      fetch(e.request).then(function(r) {
        if (r && r.ok) { var copia = r.clone(); caches.open(CACHE).then(function(c) { c.put('encargado.html', copia); }); }
        return r;
      }).catch(function() {
        return caches.match('encargado.html', { ignoreSearch: true });
      })
    );
    return;
  }
  var esFirebaseLib = url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0;
  var esAsset = url.origin === self.location.origin && /\/(icon-192\.png|icon-512\.png|manifest-encargado\.webmanifest)$/.test(url.pathname);
  if (esFirebaseLib || esAsset) {
    e.respondWith(
      caches.match(e.request.url).then(function(hit) {
        return hit || fetch(e.request).then(function(r) {
          var copia = r.clone(); caches.open(CACHE).then(function(c) { c.put(e.request.url, copia); });
          return r;
        });
      })
    );
  }
});
