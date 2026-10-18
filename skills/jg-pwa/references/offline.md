## Offline behavior

- In hand-written workers, navigations go network-first and fall back to the precached offline page only when the network request throws, never on a 4xx or 5xx response, which the app's own error page handles.
- In hand-written workers, enable navigation preload and use `event.preloadResponse` in the navigation handler, so starting the worker doesn't delay the request.
- With jg-sw, the explicitly precached shell is served cache-first. (1.2+) `navigationFallback` names the precached page used only for a navigation absent from the cache whose network request fails; a 4xx or 5xx passes through. jg-sw has no navigation preload. Keep other HTML out of runtime caching.
- Never answer a `Range` request with a cached full `200` response. Keep media out of the cache unless the worker serves `206` slices.
- Store offline data in IndexedDB, and let the client data cache decide what persists, as jg-react describes.
- Call `navigator.storage.persist()` only after the user opts in to offline use, check the space left with `navigator.storage.estimate()`, and handle `QuotaExceededError`. Never treat browser storage as the only copy of user data.
- Background Sync is Chromium-only, so also retry queued work on the `online` event or at the next launch.
