const SLICE = 18;

const getRecordModalHTML = type => document.querySelector("#record-modal-temp")
    .innerHTML.replace("{form}", type.form_template);
const getRecordHTML = type => document.querySelector("#record-template")
    .innerHTML.replace("{type_template}", type.template);

const messages = {
    en: {},
    ru: {
        Mo: "Пн", Tu: "Вт", We: "Ср", Th: "Чт", Fr: "Пт", Sa: "Сб", Su: "Вс",
        Tags: "Теги", Change: "Изменить", "Change date": "Изменить дату",
        Year: "Год", Month: "Месяц", Go: "Перейти", Date: "Дата", Time: "Время",
        "Loading...": "Загрузка...", "No records": "Нет записей",
        Close: "Закрыть", Delete: "Удалить", Create: "Создать", Save: "Сохранить",
        'Open post records menu': "Открыть меню создния записей",
        'No tags': "Нет тегов",
    }
};

const i18n = VueI18n.createI18n({
    locale: window.navigator.language.slice(0, 2),
    fallbackLocale: 'en',
    messages,
});

const App = Vue.createApp({
    data: () => ({
        editors: {},
        types: null,
        allRecords: null,
        slice: SLICE,
        options: {},
        today: moment().format("YYYY-MM-DD"),
        isUseGD: settings.get("isUseGD"),
        syncInterval: settings.get("syncInterval") / 60 / 1000,
        password1: "",
        password2: "",
        question: settings.get("question"),
        answer: "",
    }),
    methods: {
        async DB(method, store, index_or_data) {
            await DB[method](store, index_or_data);
            await this.update();
        },
        async update() {
            await Processes.fun(async () => {
                this.types = await DB.getAll("types");
                this.allRecords = await DB.getAll("records");
            });
        },
        async callEditor(typeUUID, data) {
            await this.editors[typeUUID](data);
        },
        getFormattedDate: date => moment(date).format("LL"),
        getDateUrl: date => `#date/${moment(date).format("YYYY-MM-DD")}`,
        getTagUrl: tag => `#tag/${tag}`,

        changeDate(date) {
            location = this.getDateUrl(date);
        },
        changeDay(days) {
            const date = new Date(this.options.date);
            location = this.getDateUrl(date.setDate(date.getDate() + days));
        },
        async exportData() {
            await Processes.fun(async () =>
                giveFile((await DB.export())["data.json"], "data.json"));
        },
        async importData() {
            await Processes.fun(async () =>
                await DB.import({ "data.json": (await getFile())[0] }));
            await this.update();
        },
        async deleteAll() {
            if (confirm("Вы удалите данные и востановите типы по умолчанию")) {
                await Processes.fun(async () => {
                    await DB.clear("types");
                    await DB.clear("records");
                    await DB.put("types", ...DefaultTypes);
                    await this.update();
                });
            };
        },
        async addType() {
            await Processes.fun(async () => {
                const data = JSON.parse(await (await getFile())[0].text());
                if (data.version == 5) {
                    await DB.put("types", data.type);
                };
            });
        },
        async setPassword() {
            if (!this.password1) {
                settings.set("passwordHash", null);
                settings.set("question", null);
                settings.set("answerHash", null);
                settings.set("passwordCipher", null);
                settings.set("passwordIv", null);
            } else if (this.password1 != this.password2) {
                alert("Пароли не совпают");
            } else if (!this.question || !this.answer) {
                alert("Нет контрольного вопроса или ответа");
            } else {
                await DB.setPassword(this.password1);
                await DB.sync();
                settings.set("passwordHash", await getPasswordHash(this.password1));
                settings.set("question", this.question);
                settings.set("answerHash", await getPasswordHash(this.answer));
                const temp = await encrypt(this.answer, strToAB(this.password1));
                settings.set("passwordCipher", ABToStr(temp.data));
                settings.set("passwordIv", temp.iv);
                this.password1 = this.password2 = "";
            };
        },
        async unlock() {
            const el = document.querySelector("#passwordModal");
            const modal = new bootstrap.Modal(el, {
                backdrop: "static", keyboard: false });
            el.addEventListener('shown.bs.modal', () =>
                this.$refs.passwordInput.focus()
            );
            modal.show();
            while (true) {
                await new Promise(r => this.$refs.passwordInput.oninput = r);
                let value = this.$refs.passwordInput.value;
                let hash = value ? await getPasswordHash(value) : null;
                if (settings.get("passwordHash") == hash) {
                    await DB.startUsePassword(value);
                    break
                } else if (settings.get("answerHash") == hash) {
                    let t = strToAB(settings.get("passwordCipher"));
                    t = await decrypt(value, settings.get("passwordIv"), t);
                    await DB.startUsePassword(ABToStr(t));
                    break
                };
            };
            modal.hide();
        },
        async deleteFromGD() {
            await this.GD.deleteFromGD();
        },
        async startGD() {
            this.GD = new GDDBClass(isSignedIn => {
                if (!isSignedIn) {
                    const element = document.querySelector("#startGDModal");
                    new bootstrap.Modal(element).show();
                };
            });
            await this.syncWithGD();
            if (settings.get("syncInterval")) {
                setInterval(this.syncWithGD, settings.get("syncInterval"));
            };
        },
        async _syncWithGD() {
            const datafromGD = await this.GD.importFromGD();
            const datafromDB = await DB.export();
            if (datafromGD != datafromDB) {
                await DB.import(datafromGD);
                await this.GD.exportToGD(await DB.export());
                await this.update();
            };
        },
        async syncWithGD() {
            const t = setInterval(() => Processes.fun(async () => {
                try {
                    await this._syncWithGD();
                    clearInterval(t);
                } catch (error) {
                    if (error == INVALIDPASSWORD) {
                        clearInterval(t);
                        throw INVALIDPASSWORD;
                    };
                }
            }), 1000);
        },
    },
    async mounted() {
        this.options = window.options;
        if (settings.get("passwordHash")) await this.unlock();
        if (this.isUseGD) await this.startGD();
        await this.update();
    },
    watch: {
        isUseGD: value => settings.set("isUseGD", value),
        syncInterval: v => settings.set("syncInterval", (v > 0 ? v : 1) * 60000),
    },
    computed: {
        records: vm => {
            if (!vm.allRecords) {
                return null;
            };
            const q = (vm.options.q || "").toLowerCase();
            const records = vm.allRecords.filter(i => {
                if ((i.$deleted) ||
                    (vm.options.type && i.$type != vm.options.type) ||
                    (vm.options.tag && !i.$tags.includes(vm.options.tag)) ||
                    (vm.options.date && i.$date != vm.options.date)) {
                    return false;
                };
                if (q) {
                    const type = vm.types.find(type => type.uuid == i.$type);
                    const text = window.eval(type.getSearchText)(type, i);
                    if (!text || !text.toLowerCase().includes(q)) {
                        return false;
                    };
                };
                return true;
            });
            records.sort((a, b) => a.$date + a.$time < b.$date + b.$time ? 1 : -1);
            if (vm.slice > 0) {
                return records.slice(0, vm.slice);
            } else {
                return records.slice(vm.slice);
            };
        },
        tags: v => [...new Set((v.allRecords || []).filter(i => !i.$deleted)
            .map(i => i.$tags).flat())],
    },
});

function toggleCreationMenu() {
    document.querySelector("#creation-menu").classList.toggle("show")
};

Processes.addListener(isBusy => {
    document.querySelector("#progress-bar").hidden = !isBusy;
});

App.component("modal", {
    functional: true,
    props: ["title", "isnotfooter"],
    template: "#modal-template",
});

App.component("wysiwyg-editor", {
    functional: true,
    template: `<div ref="div"></div>`,
    props: ["modelValue"],
    watch: {
        modelValue(val) {
            if (this.editor.getData() != val) {
                this.editor.setData(val);
            };
        },
    },
    async mounted() {
        this.editor = await initEditor(this.$refs["div"]);
        this.editor.setData(this.modelValue);
        this.editor.model.document.on('change:data', () => {
            this.$emit("update:modelValue", this.editor.getData());
        });
    },
});

App.component('autosize-textarea', {
    functional: true,
    props: ["modelValue"],
    template: '<pre class=autosize-textarea @input=s contenteditable></pre>',
    methods: {
        s() {
            this.$emit('update:modelValue', this.$el.innerText);
        },
    },
    watch: {
        modelValue(val) {
            if (this.$el.innerText != val) {
                this.$el.innerText = val;
            };
        },
    },
    mounted() {
        this.$el.innerText = this.modelValue;
    },
});

App.component('records', {
    functional: true,
    props: ["records"],
    template: "#records-list-template",
});

App.component("calendar", {
    props: ["id", "first_date"],
    template: "#calendar-template",
    data() {
        const date = new Date(Date.parse(this.first_date) || new Date);
        return {year: date.getFullYear(), month: date.getMonth()+1, days: []};
    },
    methods: {
        getClassesDay(date) {
            const classes = ["day"];
            if (date.getMonth() + 1 == this.month) classes.push('active');
            if (moment(date).format('YYYYMMDD') == moment().format('YYYYMMDD'))
                classes.push('today');
            return classes;
        },
        async update() {
            this.days = await getDays(this.year, this.month);
        },
    },
    computed: {
        title: vm => moment(new Date(vm.year, vm.month - 1))
            .format("MMMM YYYY").toUpperCase(),
    },
    async created() {
        await this.update();
    },
});

App.component("record-editor", {
    template: "#record-editor-template",
    props: ["type"],
    data: vm => ({ form: {} }),
    methods: {
        async call(record) {
            const modal = new bootstrap.Modal(this.$el, {
                backdrop: false, keyboard: false });
            this.form = Object.assign({}, (record || this.getRecord()));
            modal.show();
            try {
                await new Promise((r, j) =>
                    (this.$refs.btn.onclick = r, this.$refs.cls.onclick = j));
                const data = Object.assign({}, this.form);
                data.$tags = window.eval(this.type.getRecordTags)(this.type,
                    this.form);
                await this.$root.DB((record ? "put" : "add"), "records", data);
            } catch (error) { };
            modal.hide();
            this.form = {};
        },
        getRecord() {
            const record = {
                $type: this.type.uuid,
                $tags: options.tag ? [options.tag] : [],
                $date: moment().format("YYYY-MM-DD"),
                $time: moment().format("HH:mm"),
            };
            return window.eval(this.type.addBlankRecord)(this.type, record);
        },
        async remove() {
            await this.$root.DB("del", "records", this.form.$id);
        },
    },
    computed: {
        isValid: v => window.eval(v.type.isRecordValid)(v.type, v.form),
    },
    created() {
        this.form = this.getRecord();
        this.$root.editors[this.type.uuid] = this.call;
    },
});

BaseAppRecord = {
    functional: true,
    props: ["record"],
    methods: {
        datetime: x => moment(x.$date + "T" + x.$time).format("LLL"),
    },
    computed: {
        type: v => v.$options.type
    },
};

DB.getAll("types").then(recordTypes => {
    recordTypes.forEach(type => {
        App.component(`modal-record-${type.uuid}`, {
            functional: true,
            props: ["form"],
            template: getRecordModalHTML(type),
        });
        App.component(`record-${type.uuid}`, {
            extends: BaseAppRecord,
            template: getRecordHTML(type),
            type,
        });
        App.component(`page-record-${type.uuid}`, {
            functional: true,
            template: type.page_title ? type.page_template : "",
        });
    });
});

async function main() {
    App.use(i18n);
    const vueApp = App.mount("#app");
    window.addEventListener("hashchange", () => {
        vueApp.options = window.options;
        vueApp.update();
    });
    window.vueApp = vueApp;
};

main();
