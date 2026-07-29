self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A simple fetch handler to satisfy PWA requirements
self.addEventListener('fetch', (event) => {
  // We can just let the browser handle the fetch normally
  return;
});
