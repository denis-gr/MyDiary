const SLICE = 10;

TYPES = [{
    "title": "Заметка",
    "uuid": "abb116ac-697a-11eb-ac85-c0e434b07c91",
    "description": "Одно поле для текста",
    "icon": "pencil-fill",
    "template": document.querySelector("#record-type-template").innerHTML,
    "form_template": document.querySelector("#record-type-form-template").innerHTML,
    "fields": {
        "tags": ["text"],
        "search": ["text"],
        "require": ["text"]
    },
}, {
    "title": "Идея",
    "uuid": "0f3e74c0-beca-4d91-8b37-0d8af574afd7",
    "description": "Одно поле для текста, есть страница, со списком идей.",
    "icon": "chat-fill",
    "template": document.querySelector("#idea-type-template").innerHTML,
    "form_template": document.querySelector("#idea-type-form-template").innerHTML,
    "fields": {
        "tags": ["text"],
        "search": ["text"],
        "require": ["text"]
    },
    "page": {
        "title": "Идеи",
        "template": document.querySelector("#idea-type-page-template").innerHTML,
    },
}, {
    "title": "Задача",
    "uuid": "ee5a8960-6e2b-11eb-b6df-c0e434b07c91",
    "description": "Одно поле для описания задачи, одно поле для обозначения завершенности и заключения, есть страница, со списком задач.",
    "icon": "calendar-event-fill",
    "template": document.querySelector("#task-type-template").innerHTML,
    "form_template": document.querySelector("#task-type-form-template").innerHTML,
    "fields": {
        "tags": ["text", "conclusion"],
        "search": ["text", "conclusion"],
        "require": ["text"],
    },
    "page": {
        "title": "Задачи",
        "template": document.querySelector("#task-type-page-template").innerHTML,
    },
}];

CONVECTORS = {
    universum: {
        universum: text => text,
        mydiary: text => {
            CONVESTORS = {
                "3": {
                    "ru.schustovd.diary.api.CommentMark": data => ({
                        "$type": "abb116ac-697a-11eb-ac85-c0e434b07c91",
                        "$time": data["time"],
                        "$date": data["date"],
                        "$tags": getTags(data["comment"]),
                        "text": data["comment"],
                    }),
                    "ru.schustovd.diary.api.IdeaMark": data => ({
                        "$type": "cb363470-6e2b-11eb-91ec-c0e434b07c91",
                        "$time": data["time"],
                        "$date": data["date"],
                        "$tags": getTags(data["comment"]),
                        "text": data["comment"],
                    }),
                    "ru.schustovd.diary.api.TaskMark": data => ({
                        "$type": "ee5a8960-6e2b-11eb-b6df-c0e434b07c91",
                        "$time": data["time"],
                        "$date": data["date"],
                        "$tags": getTags(data["comment"], data["conclusion"]),
                        "text": data["comment"],
                        "isDone": data["done"],
                        "conclusion": data["conclusion"],
                    }),
                },
            };
            data = JSON.parse(text);
            version = data["version"];
            errorTypes = new Set();
            newData = {
                records: [],
                tags: new Set(),
                types: TYPES,
                version: "1",
            };
            data.marks.forEach(i => {
                convector = CONVESTORS[version][i.type];
                if (convector) {
                    record = convector(i);
                    record.$tags.forEach(tag => newData.tags.add(tag));
                    newData.records.push(record);
                } else {
                    errorTypes.add(i.type);
                };
            });
            newData.tags = [...newData.tags];
            if (errorTypes) {
                console.log("Error Types", errorTypes);
            };
            return JSON.stringify(newData);
        },
    },
    mydiary: {
        mydiary: text => text,
        universum: text => {
            CONVESTORS = {
                "1": {
                    "abb116ac-697a-11eb-ac85-c0e434b07c91": data => ({
                        "comment": data["text"],
                        "id": GetUUID4(),
                        "date": data["$date"],
                        "time": data["$time"],
                        "created": data["$created"],
                        "changed": data["$changed"],
                        "type": "ru.schustovd.diary.api.CommentMark"
                    }),
                    "cb363470-6e2b-11eb-91ec-c0e434b07c91": data => ({
                        "comment": data["text"],
                        "id": GetUUID4(),
                        "date": data["$date"],
                        "time": data["$time"],
                        "created": data["$created"],
                        "changed": data["$changed"],
                        "type": "ru.schustovd.diary.api.CommentMark"
                    }),
                    "838d858c-7a4f-4396-b3ba-f76855697e78": data => ({
                        "comment": data["text"],
                        "done": data["isDone"],
                        "conclusion": data["conclusion"],
                        "id": GetUUID4(),
                        "date": data["$date"],
                        "time": data["$time"],
                        "created": data["$created"],
                        "changed": data["$changed"],
                        "type": "ru.schustovd.diary.api.CommentMark"
                    }),                    
                },
            };
            data = JSON.parse(text);
            newData = {
                version: "3",
                marks: [],
                recurrences: []
            };
            version = data["version"];
            data.records.forEach(i => {
                convector = CONVESTORS[version][i.$type];
                record = convector(i);
                newData.marks.push(record);
            });
            return JSON.stringify(newData);
        },
    },
};

const getRecordModalHTML = type => document.querySelector("#record-modal-template").innerHTML.replace("{form}", type.form_template);
const getRecordHTML = type => document.querySelector("#record-template").innerHTML.replace("{type_template}", type.template);

function GetUUID4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (
        c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
};

function getTags(...texts) {
    text = texts.join(" ");
    words = text.split(/\s/g);
    tags = words.filter(x => (x[0] == "#") && (x.length > 1));
    tags = tags.map(x => x.slice(1));
    return [...new Set(tags)];
};

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

    let days = [];
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

function toggleCreationMenu() {
    document.querySelector("#creation-menu").classList.toggle("show")
};

BaseVueRecord = {
    props: ["id_record"],
    data: () => ({
        record: {},
        form: {},
    }),
    methods: {
        getModalComponent: uuid => `modal-record-type-${uuid}`,
        datetime: x => moment(x.$date + "T" + x.$time).format("LLL"),
        url_date: x => `{{ start_url }}/date.html?date=${moment(x.$date).format("YYYY-MM-DD")}`,
        url_tag: tag => `{{ start_url }}/tag.html?tag=${tag}`,
        async remove() {
            await vueApp.removeRecord(this);
        },
        async save() {
            this.record = {
                ...this.form
            };
            fields = this.type.fields.search;
            fields = fields.filter(field => this.record[field]);
            tags = fields.map(field => this.record[field].split(/\s/)).flat();
            tags = tags.filter(x => x[0] == "#").map(x => x.slice(1)).filter(x => x);
            tags = await Promise.all(tags.map(DB.pullTag));
            this.record.$tags = tags.map(x => x.name);
            await DB.putRecord(this.record);
            await vueApp.removeUnusedTags();
        },
    },
    async created() {
        this.record = await DB.getRecord(this.id_record);
        this.form = {
            ...this.record
        };
    },
};

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

Vue.component("record-type-creator", {
    template: "#creation-element-template",
    props: ["type"],
    data: () => ({
        record: {}
    }),
    methods: {
        getModalComponent: uuid => `modal-record-type-${uuid}`,
        async add(data) {
            fields = this.type.fields.search;
            fields = fields.filter(field => data[field]);
            tags = fields.map(field => data[field].split(/\s/)).flat();
            tags = tags.filter(x => x[0] == "#").map(x => x.slice(1)).filter(x => x);
            tags = await Promise.all(tags.map(DB.pullTag));
            data.$tags = tags.map(x => x.name);
            await vueApp.addRecord(data);
            this.record = this.getRecord();
        },
        getRecord() {
            return {
                $type: this.type.uuid,
                $tags: options.tag ? [options.tag] : [],
                $date: new Date(Date.parse(options.date) || new Date).toISOString().slice(null, 10),
                $time: moment().format("HH:mm"),
            };
        },
    },
    created() {
        this.record = this.getRecord();
    },
});

DB.getTypes().then(recordTypes => {
    recordTypes.forEach(type => {
        Vue.component(`modal-record-type-${type.uuid}`, {
            props: ["record"],
            template: getRecordModalHTML(type),
        });
        Vue.component(`record-type-${type.uuid}`, {
            extends: BaseVueRecord,
            template: getRecordHTML(type),
            data: () => ({
                type
            }),
        });
    });
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
        convector: {
            fromType: "universum",
            toType: "mydiary",
            convectorsTypes: {
                "universum": "Универсум",
                "mydiary": "Мой дневник",
            },
        },
    },
    methods: {
        async addRecord(data) {
            record = await DB.addRecord(data);
            this.records.unshift(record);
            await this.update();
        },
        async removeRecord(record) {
            await DB.delRecord(record.id_record);
            index = this.records.findIndex(data => data.$id == record.id_record);
            record = this.records[index];
            this.records.splice(index, 1);
            await this.removeUnusedTags();
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
        getRecordTypeComponent: uuid => `record-type-${uuid}`,

        async exportData() {
            data = { version: "1" };
            data.types = await DB.getTypes();
            data.records = await DB.getRecords({});
            data.tags = await DB.getTags();
            data.records.forEach(i => delete i.id);
            data.types.forEach(i => delete i.id);
            data.tags.forEach(i => delete i.id);
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
            if (data.version == 1) {
                data.records.forEach(i => delete i.id);
                data.types.forEach(i => delete i.id);
                data.tags.forEach(i => delete i.id);
                await Promise.all(data.records.map(DB.addRecord));
                await Promise.all(data.tags.map(DB.pullTag));
                await Promise.all(data.types.map(DB.addType));
                this.update();
            };
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
            if (data.version == 1) {
                delete data.id;
                await DB.addType(data.type);
                this.update();                
            };        
        },
        async startConvector() {
            var fromFile = document.querySelector("#formFile").files[0];
            var fromText = await fromFile.text();
            var toText = CONVECTORS[this.convector.fromType][this.convector.toType](fromText);
            var blob = new Blob([toText]);
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', "DB.json");
            link.click();
        },
    },
    created() {
        this.update();
    }
});

if (document.querySelector("#page")) {
    DB.getType(options.type).then(type => {
        if (type && type.page) {
            document.querySelector("#page").innerHTML = type.page.template;
        } else {
            document.querySelector("#page .load").hidden = true;
            document.querySelector("#page .errors").hidden = false;
        };
    }).then(() => vueApp.$mount("#app"));
} else {
    vueApp.$mount("#app");
};
