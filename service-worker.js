/* Manifest version: BNNHSvPN */
// Caution! Be sure you understand the caveats before publishing an application with
// offline support. See https://aka.ms/blazor-offline-considerations

self.importScripts('./service-worker-assets.js');
self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', event => event.respondWith(onFetch(event)));

const cacheNamePrefix = 'offline-cache-';
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}`;
const offlineAssetsInclude = [ /\.dll$/, /\.pdb$/, /\.wasm/, /\.html/, /\.js$/, /\.json$/, /\.css$/, /\.woff$/, /\.png$/, /\.jpe?g$/, /\.gif$/, /\.ico$/, /\.blat$/, /\.dat$/ ];
const offlineAssetsExclude = [ /^service-worker\.js$/ ];

// Replace with your base path if you are hosting on a subfolder. Ensure there is a trailing '/'.
const base = "/";
const baseUrl = new URL(base, self.origin);
const manifestUrlList = self.assetsManifest.assets.map(asset => new URL(asset.url, baseUrl).href);

async function onInstall(event) {
    console.info('Service worker: Install');

    // Fetch and cache all matching items from the assets manifest
    const assetsRequests = self.assetsManifest.assets
        .filter(asset => offlineAssetsInclude.some(pattern => pattern.test(asset.url)))
        .filter(asset => !offlineAssetsExclude.some(pattern => pattern.test(asset.url)))
        .map(asset => new Request(asset.url, { integrity: asset.hash, cache: 'no-cache' }));
    await caches.open(cacheName).then(cache => cache.addAll(assetsRequests));
}

async function onActivate(event) {
    console.info('Service worker: Activate');

    // Delete unused caches
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys
        .filter(key => key.startsWith(cacheNamePrefix) && key !== cacheName)
        .map(key => caches.delete(key)));
}

async function onFetch(event) {
    let cachedResponse = null;
    if (event.request.method === 'GET') {
        // For all navigation requests, try to serve index.html from cache,
        // unless that request is for an offline resource.
        // If you need some URLs to be server-rendered, edit the following check to exclude those URLs
        const shouldServeIndexHtml = event.request.mode === 'navigate'
            && !manifestUrlList.some(url => url === event.request.url);

        const request = shouldServeIndexHtml ? 'index.html' : event.request;
        const cache = await caches.open(cacheName);
        cachedResponse = await cache.match(request);
    }

    return cachedResponse || fetch(event.request);
}

// notifications

self.addEventListener('push', function (event) {
	console.log('push notification received: ', event);
	console.log('event data: ', event.data);

	const data = event.data.json();
	const options = {
		body: data.body,
		icon: data.icon || '/images/icons/icon-192x192.png',
		badge: data.badge || '/images/icons/badge-72x72.png',
		data: {
			url: data.url || '/'
		},
		vibrate: [200, 100, 200]
	};
	event.waitUntil(
		self.registration.showNotification(data.title, options)
	);
});

self.addEventListener('notificationclick', function (event) {
	const notification = event.notification;
	const data = notification.data;

    console.log('notification clicked: ', event);

	//event.waitUntil(
	//	self.clients
	//		.matchAll({ type: 'window' })
	//		.then(clients => {
	//			// Prefer navigating in the currently visible tab.
	//			var client = clis.find(c => {
	//				return c.visibilityState == 'visible';
	//			});
	//		})

	const urlToOpen = new URL(data.url, self.location.origin).href;
	console.log('Navigating to ' + urlToOpen);

	event.waitUntil(
		clients.openWindow(urlToOpen)
	);
	notification.close();
});

self.addEventListener('notificationclose', event => {
	const notification = event.notification;
	const primaryKey = notification.data.primaryKey;

	console.log('Closed notification: ' + primaryKey);
});
