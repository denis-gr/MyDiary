const SLICE = 10;



Vue.component("modal", {
    props: ["title"],
    template: "#modal-template",
});

Vue.component('autosize-textarea', {
    props: ["value"],
    template: `<pre class="autosize-textarea"contenteditable="true"v-text="value" @blur="$emit('input', $event.target.innerText)"></pre>`,
});


Vue.component("calendar", {
    props: ["id", "first_date"],
    template: "#calendar-template",
    data() {
        date = new Date(Date.parse(this.first_date) || new Date);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            days: getDays(date.getFullYear(), date.getMonth() + 1),
        }
    },
    methods: {
        getClassesDay(date) {
            classes = ["day"];
            classes.push(date.getMonth() + 1 == this.month ? 'active' : 'passive');
            classes.push(moment(date).format('L') == moment(new Date()).format('L') ? 'today' : '');
            return classes;
        },
        getUrlDay: (date) => `{{ start_url }}/date.html?date=${moment(date).format('YYYY-MM-DD')}`,
        update() {
            this.days = getDays(this.year, this.month);
        },
    },
    computed: {
        title: vm => moment(`${vm.year}${vm.month}`, "YYYYMM").format("MMMM YYYY").toUpperCase(),
    },
});

function getDays(year, month) {
    const date = (year && month) ? new Date(year, month - 1, 1) : new Date();

    var date1 = new Date(date);
    date1.setDate(1);
    if (date1.getDay() != 1) {
        date1.setDate(0);
        date1.setDate(date1.getDate() - date1.getDay() + 1);
    };

    var date2 = new Date(date);
    date2.setMonth(date2.getMonth() + 1);
    date2.setDate(0);
    if (date2.getDay() != 0) {
        date2.setDate(date2.getDate() + 7 - date2.getDay());
    };

    let days = new Array();
    let i = 0;
    while (date1 <= date2) {
        if (Math.floor(i % 7) == 0);
        days.push([]);
        days[Math.floor(i / 7)].push(new Date(date1));
        date1.setDate(date1.getDate() + 1);
        i++;
    };
    days = days.filter(x => x.length);
    return days;
};



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
        async add(data) {
            tags = this.type.fields.search.map(field => data.content[field].split(/\s/)).flat();
            tags = tags.filter(x => x[0] == "#").map(x => x.slice(1)).filter(x => x);
            tags = await Promise.all(tags.map(DB.pullTag));
            data.tags = tags.map(x => x.name);
            await vueApp.addRecord(data);
            this.record = this.getRecord();
        },
        getRecord() {
            return {
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
});

function createVueRecord(a, b) {
    Vue.component(`${a.name}-record`, {
        props: ["id_record"],
        template: getRecordHTML(a),
        data: () => ({
            type: null,
            icon: null,
            record: {
                content: {}
            },
            form: {
                content: {}
            },
        }),
        methods: {
            datetime: x => moment(x.date + "T" + x.time).format("LLL"),
            url_date: x => `{{ start_url }}/date.html?date=${moment(x.date).format("YYYY-MM-DD")}`,
            url_tag: tag => `{{ start_url }}/tag.html?tag=${tag}`,
            async remove() {
                await vueApp.removeRecord(this);
            },
            async save() {
                this.record = Object.assign({}, this.form);
                this.record.content = Object.assign({}, this.form.content);
                tags = this.type.fields.search.map(field => this.record.content[field].split(/\s/)).flat();
                tags = tags.filter(x => x[0] == "#").map(x => x.slice(1)).filter(x => x);
                tags = await Promise.all(tags.map(DB.pullTag));
                this.record.tags = tags.map(x => x.name);
                await DB.putRecord(this.record);
                await vueApp.removeUnusedTags();
            },
        },
        async created() {
            this.record = Object.assign({}, await DB.getRecord(this.id_record));
            this.type = Object.assign({}, b.find(x => x.uuid == this.record.type));
            this.icon = this.type.icon;
            this.form = Object.assign({}, this.record);
            this.form.content = Object.assign({}, this.record.content);
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
});


const vueApp = new Vue({
    data: {
        types: [],
        records: null,
        tags: null,
        options: {
            type: options.type || "",
            date: options.date,
            q: options.q,
            tag: options.tag,
            slice: options.slice || SLICE,
        },
        today: moment().format("YYYY-MM-DD"),
    },
    methods: {
        async addRecord(data) {
            record = await DB.addRecord(data);
            this.records.unshift(record);
            await this.update();
        },
        async removeRecord(record) {
            await DB.delRecord(record.id);
            index = this.records.findIndex(data => data.id == record.id);
            record = this.records[index];
            this.records.splice(index, 1);
            await this.removeUnusedTags(record.tags);
            await this.update();
        },
        async update() {
            this.records = this.tags = null;
            date = this.date_time ? moment(this.date_time).format("YYYY-MM-DD") : null;
            this.types = await DB.getTypes();
            this.tags = await DB.getTags();
            this.records = await DB.getRecords(this.options);
        },
        async removeUnusedTags(tags) {
            await DB.removeUnusedTags(tags);
            await this.update();
        },
        async removeType(type) {
            await DB.delType(type.uuid);
            await this.update();
        },
        getFormattedDate: date => moment(date).format("LL"),
        getDateUrl: date => `{{ start_url }}/date.html?date=${moment(date).format("YYYY-MM-DD")}`,
        getTagUrl: tag => `{{ start_url }}/tag.html?tag=${tag.name}`,
        getRecordTypeComponent: id => getComponent(id),
    },
    created() {
        this.update();
    }
});




vueApp.$mount("#app")

/*
vueApp = new Vue({
    data: {  
        fromType: "universum",
        toType: "mydiary",
        convectorsTypes: {
            "universum": "Универсум",
            "mydiary": "Мой дневник",
        },
    },
    methods: {
        async exportData() {
            data = {};
            data.types = await DB.getTypes();
            data.records = await DB.getRecords({});
            data.tags = await DB.getTags();
            data.tags = data.tags.map(tag => tag.name);
            string = JSON.stringify(data);
            var blob = new Blob([string]);
            var url = URL.createObjectURL(blob); 
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', "DB.json");
            link.click();           
        },
        async importData() {
            var file = document.querySelector("#formImportFile").files[0];
            var text = await file.text();
            data = JSON.parse(text);
            data.records.forEach(i => delete i.id);
            data.types.forEach(i => delete i.id);
            await Promise.all(data.records.map(DB.addRecord));
            await Promise.all(data.tags.map(DB.pullTag));
            this.update();
        },
        async deleteAll() {
            await DB.delTypes();
            await DB.delTags();
            await DB.delRecords();
            await dbPromise.then(createDefaultTypes);
            await this.update();
        },
        async addRecordType() {
            var file = document.querySelector("#typeFile").files[0];
            var text = await file.text();
            data = JSON.parse(text);
            await DB.addType(data);
            this.update();
        },
        async startConvector() {
            var fromFile = document.querySelector("#formFile").files[0];
            var fromText = await fromFile.text();
            var toText = CONVECTORS[this.fromType][this.toType](fromText);
            var blob = new Blob([toText]);
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', "DB.json");
            link.click();
        }
    },
});



DB.getType(options.type).then(type => {
    if (type && type.page) {
        document.querySelector("#page").innerHTML = type.page.template;
    } else {
        document.querySelector("#page .load").hidden = true;
        document.querySelector("#page .errors").hidden = false;
    };
}).then(() => vueApp.$mount("#app"));
*/