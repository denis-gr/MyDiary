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
    'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/fonts/bootstrap-icons.woff',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/fonts/bootstrap-icons.woff2',
    'https://cdn.jsdelivr.net/npm/workbox-sw@6/build/workbox-sw.min.js',
    'https://cdn.jsdelivr.net/npm/moment@2/moment.min.js',
    'https://cdn.jsdelivr.net/npm/moment@2/locale/ru.min.js',
    'https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js',
    'https://cdn.jsdelivr.net/npm/idb@6/build/iife/index-min.js',
    '{{ start_url }}/about.html',
    '{{ start_url }}/date.html',
    '{{ start_url }}/main_anonymous.html',
    '{{ start_url }}/main.html',
    '{{ start_url }}/other.html',
    '{{ start_url }}/search.html',
    '{{ start_url }}/tag.html',
    '{{ start_url }}/static/styles/base.css',
    '{{ start_url }}/static/styles/themes/base-light.css',
    '{{ start_url }}/static/js/db.js',
    '{{ start_url }}/static/js/main_components.js',
    '{{ start_url }}/static/js/record_components.js',
    '{{ start_url }}/static/js/vue_components.js',
    '{{ start_url }}/static/js/vue_other_page.js',
    '{{ start_url }}/static/js/base.js',
    '{{ start_url }}/index.html',
    '{{ start_url }}/sw.js',
], {
    ignoreURLParametersMatching: [/.*/]
});
