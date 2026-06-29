const CACHE='sara-palm-v46-system-placement-1';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','style.css','app.js','manifest.json','sara.jpg','icon.png','icon-192.png','bg.png','palm-reading-photo.jpg']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
