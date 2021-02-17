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
        async update() {
            this.countTags = await DB.countTags();
            this.countRecords = await DB.countRecords();
            this.countTypes = await DB.countTypes();
            this.types = await DB.getTypes();
        },
        async load_type() {
            type = JSON.parse(this.json);
            await DB.addType(type);
            this.json = "";
            await this.update();
        },
        async remove(type) {
            await DB.delType(type.uuid);
            await this.update();
        },
        async exportData() {
            this.is_export_bnt_disabled = true;
            fileHandle = await showSaveFilePicker();
            fileWritable = await fileHandle.createWritable();
            data = {};
            data.types = await DB.getTypes();
            data.records = await DB.getRecords({});
            data.tags = await DB.getTags();
            data.tags = data.tags.map(tag => tag.name);
            string = JSON.stringify(data);
            await fileWritable.write(string);
            await fileWritable.close();
            this.is_export_bnt_disabled = false;            
        },
        async importData() {
            this.is_import_bnt_disabled = true;
            fileHandles = await showOpenFilePicker();
            fileHandle = await fileHandles[0];
            file = await fileHandle.getFile();
            text = await file.text();
            data = JSON.parse(text);
            data.records.forEach(i => delete i.id);
            data.types.forEach(i => delete i.id);
            await Promise.all(data.records.map(DB.addRecord));
            await Promise.all(data.tags.map(DB.pullTag));
            this.update();
            this.is_import_bnt_disabled = false;
        },
        async deleteAll() {
            this.is_delete_bnt_disabled = true;
            await DB.delTypes();
            await DB.delTags();
            await DB.delRecords();
            await dbPromise.then(createDefaultTypes);
            await this.update();
            this.is_delete_bnt_disabled = false;
        },
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
    created: function () {
        this.update();
    },
});