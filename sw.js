const CACHE='siape-v3412h-laboratorio-sin-plan-mejora';
const ASSETS=['./styles.css?v=3412h','./app.js?v=3412h','./data.js?v=3412h','./laboratorio-data.js?v=3412h','./laboratorio.js?v=3412h','./manifest.json','./firebase-config.js?v=3412h','./pami-logo.png'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    fetch(event.request,{cache:'no-store'}).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match(event.request))
  );
});
