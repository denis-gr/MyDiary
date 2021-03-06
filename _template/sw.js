importScripts("https://cdn.jsdelivr.net/npm/workbox-sw@6/build/workbox-sw.min.js");

const ignoreQueryStringPlugin = {
    cachedResponseWillBeUsed: async({request, cachedResponse}) =>
        cachedResponse || caches.match(request.url, {ignoreSearch: true})
};

workbox.routing.registerRoute(
    () => true,
    new workbox.strategies.StaleWhileRevalidate({
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200]
            }),
            ignoreQueryStringPlugin
        ]
    })
);

workbox.precaching.precacheAndRoute([
    "https://cdn.jsdelivr.net/npm/workbox-sw@6/build/workbox-sw.min.js",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.min.js",
    "https://cdn.jsdelivr.net/npm/moment@2/moment.min.js",
    "https://cdn.jsdelivr.net/npm/moment@2/locale/ru.min.js",
    "https://cdn.jsdelivr.net/npm/idb@6/build/iife/index-min.js",
    "https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js",
    "{{ start_url }}/static/styles/themes/base-light.css",
    "{{ start_url }}/static/styles/base.css",
    "{{ start_url }}/static/js/base.js",
    "{{ start_url }}/static/js/vue.js",
    "{{ start_url }}/static/js/db.js",
    "{{ start_url }}/static/img/diary.jpg",
    "{{ start_url }}/static/img/start.jpg",
    "{{ start_url }}/static/img/lock.jpg",
    "{{ start_url }}/static/img/data.jpg",
    "{{ start_url }}/static/img/pwa.jpg",
    "{{ start_url }}/sw.js",
    "{{ start_url }}/date.html",
    "{{ start_url }}/development.html",
    "{{ start_url }}/index.html",
    "{{ start_url }}/main.html",
    "{{ start_url }}/other.html",
    "{{ start_url }}/page.html",
    "{{ start_url }}/search.html",
    "{{ start_url }}/tag.html",
], {
    ignoreURLParametersMatching: [/.*/]
});
