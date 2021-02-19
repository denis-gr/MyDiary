const getRecordModalHTML = type => document.querySelector("#record-modal-template").innerHTML.replaceAll("{form}", type.form_template);
const getCrearionMenuLinkTemplate = type => document.querySelector("#creation-menu-link-template").innerHTML.replaceAll("{type_name}", type.name).replaceAll("{type_icon}", type.icon).replaceAll("{type_icon}", type.icon).replaceAll("{type_title}", type.title);
const getRecordHTML = type => document.querySelector("#record-template").innerHTML.replaceAll("{type_name}", type.name).replaceAll("{type_icon}", type.icon).replaceAll("{type_template}", type.template);

function toggleCreationMenu() {
    document.querySelector("#creation-menu").classList.toggle("show")
};

function createVueModalRecord(a) {
    Vue.component(`${a.name}-modal-record`, {
        props: ["record"],
        template: getRecordModalHTML(a),
    });
};

Vue.component("record-type-creator", {
    template: "#creation-element-template",
    props: ["type"],
    data() {
        return {
            record: {
                content: {},
            },
        }
    },
    methods: {
        getModalComponent: uuid => window.getModalComponent(uuid),
        async add(a) {
            tags = this.type.fields.search.map(field => a.content[field].split(/\s/)).flat();
            tags = tags.filter(x => x[0] == "#").map(x => x.slice(1)).filter(x => x);
            tags = await Promise.all(tags.map(DB.pullTag));
            a.tags = tags.map(x => x.name);
            await vueApp.addRecord(a);
            this.record = this.getRecord();
        },
        getRecord() {
            return record = {
                type: this.type.uuid,
                content: {},
                tags: options.tag ? [options.tag] : [],
                date: new Date(Date.parse(options.date) || new Date).toISOString().slice(null, 10),
                time: moment().format("HH:mm"),
            };
        },
    },
    created() {
        this.record = this.getRecord();
    },
})

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

_typesModal = {};
_types = {};
DB.getTypes().then(recordTypes => {
    temp = recordTypes.map(getCrearionMenuLinkTemplate).join("");
    document.querySelector("#creation-menu-inner").insertAdjacentHTML('afterbegin', temp);

    recordTypes.forEach(type => {
        _typesModal[type.uuid] = `${type.name}-modal-record`;
        createVueModalRecord(type);

        _types[type.uuid] = `${type.name}-record`;
        createVueRecord(type, recordTypes);
    });

    window.getComponent = uuid => _types[uuid];
    window.getModalComponent = uuid => _typesModal[uuid];
})