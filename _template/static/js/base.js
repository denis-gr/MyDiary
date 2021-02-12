const options = window.location.search.replace('?', '').split('&')
    .reduce(function (p, e) {
        var a = e.split('=');
        p[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
        return p;
    }, {});
if (window.moment) {
    moment.locale("ru");
};
document.querySelectorAll(".auto-height").map(i => i.addEventListener('keyup', () => {
    if (this.scrollTop > 0) {
        this.style.height = this.scrollHeight + "px";
    }
}));
DB.getTypes().then(types => {
    links = types.filter(type => type.page).map(type => `<li class="nav-item"><a class="nav-link"href="{{ start_url }}/page.html?page=page&type=${type.uuid}">${type.page.title}</a></li>`);
    template = links.join("");
    document.querySelector("#navbarSupportedContent ul li:first-child").insertAdjacentHTML('afterend', template);
});