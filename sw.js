// sw.js — no-op service worker for Satoshi Calculator
// Purpose: stop 404s when browsers look for /sw.js
// Does not cache or intercept anything.

self.addEventListener("install", (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim clients so it's applied right away
  event.waitUntil(self.clients.claim());
});

// Do not handle fetches — let network handle everything
self.addEventListener("fetch", (event) => {
  return;
});
