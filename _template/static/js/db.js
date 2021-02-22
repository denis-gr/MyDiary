const nameDB = "MyDiary";
const versionDB = 1;

const DefaultTypes = [{
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

function createDefaultTypes(db) {
    promises = DefaultTypes.map(i => db.add("recordTypes", i));
    return Promise.all(promises);
};

isFirst = false;

const dbPromise = idb.openDB(nameDB, versionDB, {
    upgrade(db) {
        db.createObjectStore('tags', {
            keyPath: 'id',
            autoIncrement: true
        }).createIndex('name', 'name');
        db.createObjectStore('records', {
            keyPath: '$id',
            autoIncrement: true
        }).createIndex('date', '$date');
        db.createObjectStore('recordTypes', {
            keyPath: 'id',
            autoIncrement: true
        }).createIndex('uuid', 'uuid');;
        window.isFirst = true;
    },
});

dbPromise.then(db => {
    if (isFirst) {
        createDefaultTypes(db);
    };
});

async function getRecords({
    type,
    date,
    tag,
    q,
    slice
}) {
    db = await dbPromise;
    types = await db.getAll("recordTypes");
    records = await (date ? db.getAllFromIndex("records", "date", date) : db.getAll("records"));
    records = type ? records.filter(d => d.$type == type) : records;
    records = tag ? records.filter(d => d.$tags.indexOf(tag) >= 0) : records;
    if (q) {
        q = q.toLowerCase();
        records = records.filter(record => {
            fields = types.find(type => type.uuid == record.$type).fields.search;
            for (i in fields) {
                if (record[fields[i]].toLowerCase().includes(q)) {
                    return true;
                };
                return false;
            };
        });
    };
    records = !slice ? records : (slice > 0 ? records.slice(0, slice) : records.slice(slice));
    return records;
};

async function removeUnusedTags(tags) {
    db = await dbPromise;
    tags = tags || (await db.getAll("tags")).map(tag => tag.name);
    if (!tags.length) {
        return null;
    };
    records = await db.getAll("records");
    records.forEach(record => {
        if (tags.length) {
            tags = tags.filter(tag => record.$tags.indexOf(tag) < 0);
        };
    });
    promises = tags.map(tag => db.getKeyFromIndex("tags", "name", tag));
    promises = promises.map(promise => promise.then(i => db.delete("tags", i)));
    await Promise.all(promises);
};

const DB = {
    async countTypes() {
        db = await dbPromise;
        return db.count("recordTypes");
    },
    async getTypes() {
        db = await dbPromise;
        return db.getAll("recordTypes");
    },
    async getType(uuid) {
        db = await dbPromise;
        return db.getFromIndex("recordTypes", "uuid", uuid);
    },
    async delTypes() {
        db = await dbPromise;
        await db.clear("recordTypes");
    },
    async addType(data) {
        db = await dbPromise;
        type = await db.getFromIndex("recordTypes", "uuid", data.uuid);
        if (type) {
            data = { ...data, id: type.id };
        };
        id = await db.put("recordTypes", data);
        return db.get("recordTypes", id);
    },
    async delType(uuid) {
        db = await dbPromise;
        id = await db.getKeyFromIndex("recordTypes", "uuid", uuid);
        await db.delete("recordTypes", id);
    },
    async countTags() {
        db = await dbPromise;
        return db.count("tags");
    },
    async getTags() {
        db = await dbPromise;
        return db.getAll("tags");
    },
    async delTags() {
        db = await dbPromise;
        await db.clear("tags");
    },
    async pullTag(name) {
        db = await dbPromise;
        tag = await db.getFromIndex("tags", "name", name);
        if (!tag) {
            id = await db.add("tags", {
                name
            });
            tag = await db.get("tags", id);
        };
        return tag;
    },
    async removeUnusedTags(tags) {
        await removeUnusedTags(tags)
    },
    async countRecords() {
        db = await dbPromise;
        return db.count("records");
    },
    async getRecords({
        type,
        date,
        tag,
        q,
        slice
    }) {
        return getRecords({
            type,
            date,
            tag,
            q,
            slice
        })
    },
    async delRecords() {
        db = await dbPromise;
        await db.clear("records");
    },
    async getRecord(id) {
        db = await dbPromise;
        return db.get("records", id);
    },
    async addRecord(data) {
        db = await dbPromise;
        data = Object.assign({}, data);
        data.$created = data.$changed = new Date().getTime();
        id = await db.add("records", data);
        return db.get("records", id);
    },
    async putRecord(data) {
        db = await dbPromise;
        data = Object.assign({}, data);
        data.$changed = new Date().getTime();
        id = await db.add("records", data);
        return db.get("records", id);
    },
    async delRecord(id) {
        db = await dbPromise;
        await db.delete("records", id);
    },
};
