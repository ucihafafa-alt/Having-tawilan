const CACHE='sara-palm-final-20260628-2';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','style.css','app.js','manifest.json','sara.jpg','icon.png','icon-192.png']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
