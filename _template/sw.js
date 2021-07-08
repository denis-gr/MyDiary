importScripts("https://cdn.jsdelivr.net/npm/workbox-sw@6/build/workbox-sw.min.js");

workbox.precaching.precacheAndRoute([
    { url: "https://cdn.jsdelivr.net/npm/workbox-sw@6/build/workbox-sw.min.js", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.min.css", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.min.js", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/moment@2/moment.min.js", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/moment@2/locale/ru.min.js", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/idb@6/build/iife/index-min.js", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js", revision: '0' },
    { url: "https://cdn.jsdelivr.net/npm/vue-i18n@9/dist/vue-i18n.global.prod.js", revision: '0' },
    { url: "{{ start_url }}/static/styles/themes/base.css", revision: '0' },
    { url: "{{ start_url }}/static/styles/base.css", revision: '0' },
    { url: "{{ start_url }}/static/js/convector.js", revision: '0' },
    { url: "{{ start_url }}/static/js/google.js", revision: '0' },
    { url: "{{ start_url }}/static/js/base.js", revision: '0' },
    { url: "{{ start_url }}/static/js/vue.js", revision: '0' },
    { url: "{{ start_url }}/static/js/db.js", revision: '0' },
    { url: "{{ start_url }}/static/img/password.jpg", revision: '0' },
    { url: "{{ start_url }}/static/img/google.jpg", revision: '0' },
    { url: "{{ start_url }}/static/img/diary.jpg", revision: '0' },
    { url: "{{ start_url }}/static/img/start.jpg", revision: '0' },
    { url: "{{ start_url }}/static/img/lock.jpg", revision: '0' },
    { url: "{{ start_url }}/static/img/data.jpg", revision: '0' },
    { url: "{{ start_url }}/static/img/pwa.jpg", revision: '0' },
    { url: "{{ start_url }}/static/ckeditor5/script.js", revision: '0' },
    { url: "{{ start_url }}/static/ckeditor5/build/ckeditor.js", revision: '0' },
    { url: "{{ start_url }}/static/ckeditor5/build/ckeditor.js.map", revision: '0' },
    { url: "{{ start_url }}/development.html", revision: '0' },
    { url: "{{ start_url }}/convector.html", revision: '0' },
    { url: "{{ start_url }}/index.html", revision: '0' },
    { url: "{{ start_url }}/main.html", revision: '0' },
    { url: "{{ start_url }}/icons/maskable_icon_x192.png", revision: '0' },
    { url: "{{ start_url }}/icons/maskable_icon_x512.png", revision: '0' },
    { url: "{{ start_url }}/manifest.webmanifest", revision: '0' },	
]);

workbox.routing.registerRoute(
    () => true,
    new workbox.strategies.CacheFirst()
);
