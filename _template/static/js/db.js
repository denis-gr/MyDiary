const nameDB = "MyDiary";
const versionDB = 5;
const DefaultTypes = [{
    title: "Заметка",
    uuid: "1bb116ac-697a-11eb-ac85-c0e434b07c91",
    description: "Одно поле для текста",
    icon: "pencil-fill",
    template: document.querySelector("#record-type-template").innerHTML,
    form_template: document.querySelector("#record-type-form-template").innerHTML,
    isRecordValid: "(t,r)=>!!r.text",
    getRecordTags: "(t,r)=>getHashtags(r.text)",
    getSearchText: "(t,r)=>r.text",
    addBlankRecord: "(t,r)=>({...r,text:''})",
}, {
    title: "Форматированный текст",
    uuid: "1fb116ac-697a-11eb-ac85-c0e434b07c91",
    description: "Одно поле для форматированного текста с редактором",
    icon: "file-richtext-fill",
    template: document.querySelector("#text-type-template").innerHTML,
    form_template: document.querySelector("#text-type-form-template").innerHTML,
    isRecordValid: "(t,r)=>(r.description && r.content)",
    getRecordTags: "(t,r)=>getHashtags(r.description)",
    getSearchText: "(t,r)=>r.description",
    addBlankRecord: "(t,r)=>({...r,description:'',content:''})",
}, {
    title: "Настроение",
    uuid: "3838c06e-7b72-11eb-b8d8-c0e434b07c91",
    description: "Настроение для по 5-бальной шкале",
    icon: "emoji-expressionless-fill",
    template: document.querySelector("#rate-type-template").innerHTML,
    form_template: document.querySelector("#rate-type-form-template").innerHTML,
    isRecordValid: "(t,r)=>(r.rate>0)",
    getRecordTags: "(t,r)=>[]",
    getSearchText: "(t,r)=>null",
    addBlankRecord: "(t,r)=>({...r,rate:3})",
}, {
    title: "Идея",
    uuid: "4f3e74c0-beca-4d91-8b37-0d8af574afd7",
    description: "Одно поле для текста, есть страница, со списком идей.",
    icon: "chat-fill",
    template: document.querySelector("#idea-type-template").innerHTML,
    form_template: document.querySelector("#idea-type-form-template").innerHTML,
    isRecordValid: "(t,r)=>!!r.text",
    getRecordTags: "(t,r)=>getHashtags(r.text)",
    getSearchText: "(t,r)=>r.text",
    addBlankRecord: "(t,r)=>({...r,text:''})",
}, {
    title: "Задача",
    uuid: "5e5a8960-6e2b-11eb-b6df-c0e434b07c91",
    description: "Одно поле для описания задачи, одно поле для обозначения завершенности и заключения, есть страница, со списком задач.",
    icon: "calendar-event-fill",
    template: document.querySelector("#task-type-template").innerHTML,
    form_template: document.querySelector("#task-type-form-template").innerHTML,
    isRecordValid: "(t,r)=>!!r.text",
    getRecordTags: "(t,r)=>getHashtags(r.text,r.conclusion)",
    getSearchText: "(t,r)=>(r.text+r.conclusion)",
    addBlankRecord: "(t,r)=>({...r,text:'',isDone:false,conclusion:''})",
}];

class DBClass {
    constructor(indexedDBPromise) {
        this._indexedDBPromise = indexedDBPromise;
        this._promise = this._prepare();
    };
    async _prepare() {
        this._db = await this._indexedDBPromise;
        if (this._db.isFirst) {
            let data = DefaultTypes.map(i=>({isEnable: true, index: 0, ...i}));
            data = data.map(i => this._dbRequest("put", "types", i.uuid, i));
            await Promise.all(data);
        };
    };
    async _idbRequest(method, store, key, value) {
        if (["count", "clear", "getAll"].includes(method)) {
            return this._db[method](store);
        } else if (["get", "delete"].includes(method)) {
            return this._db[method](store, key);
        } else if (["add", "put"].includes(method)) {
            return this._db[method](store, value, key);
        };
    };
    async _bufferRequest(method, store, index, data) {
        const attr = `_${store}_buffer`;
        this[attr] = this[attr] || {};
        if ("count" == method) {
            return Array.from(Object.keys(this[attr])).length;
        } else if ("clear" == method) {
            this[attr] = {};
        } else if ("getAll" == method) {
            return Object.values(this[attr]).map(i => Object.assign({}, i));
        } else if ("get" == method) {
            return Object.assign({}, this[attr][index]);
        } else if ("delete" == method) {
            delete this[attr][index];
        } else if (["add", "put"].includes(method)) {
            this[attr][index] = data;
        };
    };
    async _dbRequest(method, store, index, data) {
        if (store == "records" && this._password) {
            return this._bufferRequest(method, store, index, data);
        } else {
            return this._idbRequest(method, store, index, data);
        }
    };
    async startUsePassword(passwordPromise) {
        await this._promise;
        this._password = await passwordPromise;
        let data = await this._db.get("storage", "recordsEAB");
        if (data) {
            const iv = await this._db.get("storage", "REIVS");
            data = await decrypt(this._password, iv, data);
            this._records_buffer = JSON.parse(ABToStr(data));
        };
    };
    async setPassword(password) {
        await this._promise;
        this._password = password;
        const t1 = this._password ? "_idbRequest" : "_bufferRequest";
        const t2 = !this._password ? "_idbRequest" : "_bufferRequest";
        let data = await this[t1]("getAll", "records");
        await Promise.all(data.map(j => this[t2]("put", "records", j.$id, j)));
        await this[t1]("clear", "records");
        await this.sync();
    };
    async count(store) {
        await this._promise;
        if (store == "records") {
            const records = await this._dbRequest("getAll", "records");
            return records.filter(i => !i.$deleted).length;
        };
        return this._dbRequest("count", store);
    };
    async getAll(store) {
        await this._promise;
        if (store == "types") {
            const data = await this._dbRequest("getAll", "types");
            return data.sort((a, b) => b.index - a.index);
        };
        return this._dbRequest("getAll", store);
    };
    async get(store, ...indexes) {
        await this._promise;
        let data = indexes.map(i => this._dbRequest("get", store, i));
        data = await Promise.all(data);
        return data.length > 1 ? data : data[0];
    };
    async clear(store) {
        await this._promise;
        if (store == "records") {
            let d = await this._dbRequest("getAll", "records");
            d = d.map(i => ({...i, $deleted: !0, $changed: Number(new Date)}));
            d = d.map(i => this._dbRequest("put", "records", i.$id, i));
            await Promise.all(d);
            await this.sync();
        };
        await this._dbRequest("clear", store);
    };
    async del(store, ...ids) {
        await this._promise;
        let d;
        if (store == "types") {
            d = ids.map(i => this._dbRequest("delete", "types", i));         
        } else if (store == "records") {
            d = ids.map(i => this._dbRequest("get", "records", i));
            d = await Promise.all(d);
            d = d.map(i => ({...i, $deleted: !0, $changed: Number(new Date)}));
            d = d.map(i => this._dbRequest("put", "records", i.$id, i));
        };
        await Promise.all(d);
        await this.sync();
    };
    async put(store, ...data) {
        await this._promise;
        if (store == "types") {
            data = data.map(i => ({isEnable: true, index: 0, ...i}));
            data = data.map(i => this._dbRequest("put", "types", i.uuid, i));
        } else if (store == "records") {
            data = data.map(i => ({...i, $changed: new Date().getTime()}));
            data = data.map(i => this._dbRequest("put", "records", i.$id, i));
        };
        data = await Promise.all(data);
        await this.sync();
        return data.length > 1 ? data : data[0];
    };
    async add(store, ...data) {
        if (store != "records") {
            return this.put(store, ...data);
        };
        await this._promise;
        data = data.map(i => Object.assign({}, i));
        data.forEach(i => i.$id = i.$created = i.$changed = Number(new Date));
        data = data.map(i => this._dbRequest("put", "records", i.$id, i));
        data = await Promise.all(data);
        await this.sync();
        return data.length > 1 ? data : data[0];
    };
    async export() {
        await this._promise;
        const data = {};
        data.records = await this._dbRequest("getAll", "records"),
        data.version = "5";
        data.records.sort((a,b)=>a.$id == b.$id ? 0 :(a.$id > b.$id ? -1 : 1));
        data.records.forEach(data =>
            Object.keys(data).sort().reduce((a,i)=>({...a, [i]: data[i]}), {})
        );
        if (this._password) {
            data.records = JSON.stringify(data.records);
            const temp = await encrypt(this._password, strToAB(data.records));
            data.REABS = ABToStr(temp.data);
            data.REIVS = temp.iv;
            data.records = null;
        };
        return {"data.json": new File([JSON.stringify(data)], "data.json")};
    };
    async import(files) {
        const data = JSON.parse(await files[Object.keys(files)[0]].text());
        if (!this._password && data.REABS) {
            throw INVALIDPASSWORD;
        };
        if (this._password && data.REABS) {
            try {
                data.records = JSON.parse(ABToStr(await decrypt(this._password,
                    data.REIVS, strToAB(data.REABS))));
            } catch (error) {
                throw INVALIDPASSWORD; 
            }
        };
        if (data.version == 5) {
            for (let i in data.records) {
                const n = data.records[i];
                n.$id = n.$id || n.$created;
                const o = await this._dbRequest("get", "records", n.$id || -1);
                if (!o || !o.$changed || ((o.$changed <= n.$changed) &&
                    (JSON.stringify(o) != JSON.stringify(n)))){
                    await this._dbRequest("put", "records", n.$id, n);
                };
            };
        };
        await this.sync();
    };
    async sync() {
        await this._promise;
        await Processes.fun(async () => {
            if (this._password) {
                let data = JSON.stringify(this._records_buffer || "");
                data = await encrypt(this._password, strToAB(data));
                const tx = this._db.transaction('storage', 'readwrite');
                const store = tx.objectStore('storage');
                await store.put(data.data, "recordsEAB");
                await store.put(data.iv, "REIVS");
                await tx.done;
            };
        });
    };
    async close() {
        await this._promise;
        await this._dbRequest("close");
    };
};

const dbPromise = idb.openDB(nameDB, versionDB, {
    upgrade(db) {
        db.createObjectStore('storage');
        db.createObjectStore('types');
        db.createObjectStore('records');
        db.isFirst = true;
    }
});

DB = new DBClass(dbPromise);