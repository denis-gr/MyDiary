importScripts("https://cdn.jsdelivr.net/npm/workbox-sw@6/build/workbox-sw.min.js");const ignoreQueryStringPlugin={cachedResponseWillBeUsed:async({request,cachedResponse})=>cachedResponse||caches.match(request.url,{ignoreSearch:true})};workbox.routing.registerRoute(()=>true,new workbox.strategies.StaleWhileRevalidate({plugins:[new workbox.cacheableResponse.CacheableResponsePlugin({statuses:[0,200]}),ignoreQueryStringPlugin]}));workbox.precaching.precacheAndRoute(["https://cdn.jsdelivr.net/npm/workbox-sw@6/build/workbox-sw.min.js","https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css","https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.min.css","https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.min.js","https://cdn.jsdelivr.net/npm/moment@2/moment.min.js","https://cdn.jsdelivr.net/npm/moment@2/locale/ru.min.js","https://cdn.jsdelivr.net/npm/idb@6/build/iife/index-min.js","https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js","https://cdn.jsdelivr.net/npm/vue-i18n@9/dist/vue-i18n.global.prod.js","/static/styles/themes/base.css","/static/styles/base.css","/static/js/convector.js","/static/js/google.js","/static/js/base.js","/static/js/vue.js","/static/js/db.js","/static/img/diary.jpg","/static/img/start.jpg","/static/img/lock.jpg","/static/img/data.jpg","/static/img/pwa.jpg","/static/ckeditor5/script.js","/static/ckeditor5/build/ckeditor.js","/static/ckeditor5/build/ckeditor.js.map","/sw.js","/development.html","/convector.html","/index.html","/main.html",],{ignoreURLParametersMatching:[/.*/]});