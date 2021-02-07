vueApp = new Vue({
    el: "#app",
    data: {
        countTags: 0,
        countRecords: 0,
        countTypes: 0,
        json: "",
        types: [],
        is_export_bnt_disabled: false,
        is_import_bnt_disabled: false,
        is_delete_bnt_disabled: false,
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
            this.is_export_bnt_disabled = true;
            data = {};
            Promise.all([
                    DB.getTypes().then(types => data.types = types),
                    DB.getRecords({}).then(records => data.records = records),
                    DB.getTags().then(tags => data.tags = tags),
                ])
                .then(() => this.json = JSON.stringify(data))
                .then(() => this.is_export_bnt_disabled = false);
        },
        importJSON() {
            this.is_import_bnt_disabled = true;
            data = JSON.parse(this.json);
            data.records.forEach(i => delete i.id);
            types = {};
            promises = data.types.map(type => {
                console.log(type, type.id)
                oldId = type.id;
                console.log(type, type.id, oldId)
                delete type.id;
                console.log(type, type.id, oldId)
                return DB.addType(type).then(newType => {types[oldId] = newType.id; return [oldId, newType.id]});
            });
            Promise.all(promises)
                .then(console.log)
                .then(() => console.log(types))
            /*
                .then(() => data.records = data.records.map(i => i.type = types[i.type]))
                .then(() => Promise.all(data.records.map(i => DB.addRecord(i))))
                .then(() => Promise.all(data.tags.map(name => DB.pullTag(name))))
                .then(DB.removeUnusedTags)
                .then(this.update)
                .then(() => this.is_import_bnt_disabled = false);*/
        },
        deleteAll() {
            this.is_delete_bnt_disabled = true;
            DB.delTypes().then(DB.delTags).then(DB.delRecords)
                .then(() => dbPromise.then(createDefaultTypes))
                .then(this.update)
                .then(() => this.is_delete_bnt_disabled = false);
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
        }
    },
});

vueApp.update();