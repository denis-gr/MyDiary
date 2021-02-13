function createVueModalRecord(type) {
    Vue.component(`${type.name}-modal-record`, {
        props: ["record"],
        template: document.querySelector("#record-modal-template")
            .innerHTML.replace("{form}", type.form_template),
    });
};

typesModal = {};
DB.getTypes().then(recordTypes => {
    recordTypes.forEach(type => {
        typesModal[type.uuid] = `${type.name}-modal-record`;
        createVueModalRecord(type);
    });
    window.getModalComponent = uuid => typesModal[uuid];
});

const getCrearionMenuLinkTemplate = type => `<button class="btn btn-outline-secondary link"type="button"data-bs-toggle="modal"data-bs-target="#add-${type.name}"><i class="bi-${type.icon} icon"title="Создать ${type.title}"></i></button>`;
const getCrearionElement = type => `<modal title="${type.title}"id="add-${type.name}"><component is="${type.name}-modal-record" :record="record"></component><template v-slot:footer><button type="button"class="btn btn-primary"data-bs-dismiss="modal"@click="add(record)">Создать</button></template> </modal>`;

function toggleCreationMenu() {
    document.querySelector("#creation-menu").classList.toggle("show")
};

function createVueCreate(b) {
    new Vue({
        el: `#add-${b.name}`,
        data: () => ({
            record: {
                type: b.uuid,
                content: {},
                tags: options.tag ? [options.tag] : [],
                date: new Date(Date.parse(options.date) || new Date).toISOString().slice(null, 10),
                time: moment().format("HH:mm"),
            },
        }),
        methods: {
            getModalComponent: uuid => window.getModalComponent(uuid),
            add: function (a) {
                DB.getType(a.type).then(type => {
                    return type.fields.search.map(field =>
                        a.content[field].split(/\s/).filter(x => x[0] == "#")
                        .map(x => x.slice(1)).filter(x => x)
                    ).flat();
                }).then(tags =>
                    Promise.all(tags.map(DB.pullTag))
                    .then(tags => tags.map(x => x.name))
                    .then(tags => a.tags = tags)
                    .then(() => vueApp.addRecord(a))
                    .then(() => {
                        this.record = {
                            type: b.uuid,
                            content: {},
                            tags: options.tag ? [options.tag] : [],
                            date: new Date(Date.parse(options.date) || new Date).toISOString().slice(null, 10),
                            time: moment().format("HH:mm"),
                        }
                    }));
            },
        },
    })
};

DB.getTypes().then(recordTypes => {
    templates = recordTypes.map(getCrearionMenuLinkTemplate).join("");
    document.querySelector("#creation-menu-inner").insertAdjacentHTML('afterbegin', templates);
    recordTypes.forEach(type => {
        template = getCrearionElement(type);
        document.querySelector("#creation-menu").insertAdjacentHTML('beforebegin', template);
        createVueCreate(type);
    });
});
const getRecordHTML = type => `<div class="record-preview"><modal title="Изменить запись" :id="'editRecord'+id_record"><component is="${type.name}-modal-record" :record="form"></component><template v-slot:footer><button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="remove()">Удалить</button><button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="save()">Изменить</button></template></modal><i class="bi-${type.icon} icon left"></i><div class="right"><div class="content" data-bs-toggle="modal" :data-bs-target="'#editRecord'+id_record">${type.template}</div><div class="bottom"><a class="date" v-text="datetime(record)" :href="url_date(record)"></a><a class="tag" v-for="tag in record.tags" v-text="'#'+tag" :href="url_tag(tag)"></a></div></div></div>`;

function createVueRecord(a, b) {
    Vue.component(`${a.name}-record`, {
        props: ["id_record"],
        template: getRecordHTML(a),
        data: function () {
            DB.getRecord(this.id_record).then(record => {
                this.icon = b.find(x => x.uuid == record.type).icon;
                this.record = record;
                this.form = Object.assign({}, record);
                this.form.content = Object.assign({}, record.content);
            });
            return {
                icon: "",
                record: {
                    content: {}
                },
                form: {
                    content: {}
                }
            }
        },
        methods: {
            datetime: x => moment(x.date + "T" + x.time).format("LLL"),
            url_date: x => `{{ start_url }}/date.html?date=${moment(x.date).format("YYYY-MM-DD")}`,
            url_tag: tag => `{{ start_url }}/tag.html?tag=${tag}`,
            remove: function () {
                vueApp.removeRecord(this.id_record)
            },
            save: function () {
                this.record = Object.assign({}, this.form);
                this.record.content = Object.assign({}, this.form.content);
                DB.getType(this.record.type).then(type => {
                    return type.fields.search.map(field =>
                        this.record.content[field].split(/\s/).filter(x => x[0] == "#")
                        .map(x => x.slice(1)).filter(x => x)
                    ).flat();
                }).then(tags =>
                    Promise.all(tags.map(DB.pullTag))
                    .then(tags => tags.map(x => x.name))
                    .then(() => this.record.tags = tags)
                    .then(() => DB.putRecord(this.record))
                    .then(() => vueApp.removeUnusedTags())
                );
            },
        },
    })
};

types = {};
DB.getTypes().then(recordTypes => {
    recordTypes.forEach(type => {
        types[type.uuid] = `${type.name}-record`;
        createVueRecord(type, recordTypes);
    });
    window.getComponent = uuid => types[uuid];
})