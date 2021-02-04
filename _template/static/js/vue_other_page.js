vueApp = new Vue({
    el: "#app",
    data: {
        countTags: 0,
        countRecords: 0,
        countTypes: 0,
        json: "",
        types: [],
        cls1: ["btn", "btn-primary mr-2 mb-2"],
        cls2: ["btn", "btn-primary mr-2 mb-2"],
        cls3: ["btn", "btn-danger mr-2 mb-2"],
    },
    methods: {
        update() {
            return Promise.all([
                DB.countRecords().then(n => this.countRecords = n),
                DB.countTags().then(n => this.countTags = n),
                DB.countTypes().then(n => this.countTypes = n),
                DB.getTypes().then(data => this.types = data)
            ]);
        },
        load_type() {
            type = JSON.parse(this.json);
            DB.addType(type).then(() => this.json = "").then(this.update)
        },
        remove(type) {
            DB.delType(type.id).then(this.update)
        },
        exportJSON() {
            this.cls1.push("disabled");
            data = {};
            Promise.all([
                DB.getTypes().then(types => data.types = types),
                DB.getRecords({}).then(records => data.records = records),
                DB.getTags().then(tags => data.tags = tags),
            ])
            .then(() => this.json = JSON.stringify(data))
                .then(() =>
                    this.cls1.splice(this.cls1.findIndex(data => data == "disabled"), 1)
                );
        },
        importJSON() {
            this.cls2.push("disabled");
            data = JSON.parse(this.json);
            types = {};
            data.types.map(i => delete i.id);
            data.records.map(i => delete i.id);
            promises = data.types.map(i => DB.addType(i).then(d => types[i.id] = d));
            Promise.all(promises)
                .then(() => Promise.all(data.tags.map(i => DB.pullTag(i.name))))
                .then(() => {
                    data.records.map(i => i.type = types[i.type].id)
                    return Promise.all(data.records.map(i => DB.addRecord(i)));
                })
                .then(DB.removeUnusedTags)
                .then(this.update())
                .then(() =>
                    this.cls2.splice(this.cls2.findIndex(data => data == "disabled"), 1)
                );
        },
        deleteAll() {
            this.cls3.push("disabled");
            DB.delTypes().then(DB.delTags).then(DB.delRecords)
            .then(() => dbPromise.then(createDefaultTypes))
            .then(this.update)
            .then(() =>
                this.cls3.splice(this.cls3.findIndex(data => data == "disabled"), 1)
            )
        },
        clearJSON() {
            this.json = ""
        }
    },
    computed: {
        isValidJSON: vm => {
            isValidJSON = true;
            try {
                JSON.parse(vm.json)
            } catch {
                isValidJSON = false
            };
            return isValidJSON;
        },
    },
});

vueApp.update();
