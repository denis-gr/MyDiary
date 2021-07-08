const messages = {
    en: {
        message_sync_GD: "Sign in to Google to sync data with Google Drive. \nOr do you want to disable syncing?",
        message_password_modal: 'To remove the password, leave the password fields blank and click "Set". \nFor synchronization to work, all instances must either have the same password or be absent.',
        question_text: 'Or the answer to "{q}"',
        reboot_message: "These settings will be applied only after reboot",
        version: "Version: {v}",
        browser_support: "The site creator did not aim to support older browsers.",
        disclaimer: "The site is not responsible for anything.", 
    },
    ru: {
        Mo: "Пн", Tu: "Вт", We: "Ср", Th: "Чт", Fr: "Пт", Sa: "Сб", Su: "Вс",
        Tags: "Теги", Change: "Изменить", "Change date": "Изменить дату",
        Year: "Год", Month: "Месяц", Go: "Перейти", Date: "Дата",
        Time: "Время", "Loading...": "Загрузка...", Close: "Закрыть",
        "No records": "Нет записей", Delete: "Удалить", Create: "Создать",
        Save: "Сохранить", 'No tags': "Нет тегов", "Any": "Любой", 
        'Open post records menu': "Открыть меню создания записей",   
        message_sync_GD: "Войдите в Google, что бы синхронизировать данные с Google Drive. \nИли вы хотите отключить синхронизацию?",
        Disable: "Отключить", Login: "Войти", "Homepage":"Главная страница",
        "Connect to Google": "Подключение к Google", "Enable": "Включить",
        "Password setting": "Настройка пароля", "New password": "Новый пароль",
        "New password (again)": "Новый пароль (ещё раз)",
        "Security question": "Контрольный вопрос", "Use GD": "Использовать GD",
        "Answer to security question": "Ответ на контрольный вопрос",
        "message_password_modal":'Что бы убрать пароль оставьте поля с паролем пустыми и нажмите "Поставить". \nДля работы синхронизации во всех экземплярах должен, либо быть один и тот же пароль, либо отсутствовать.',
        "Set": "Поставить", "Do not change":"Не менять",
        "Unlocking": "Разблокировка", "Date":"Дата", "Tag": "Тег",
        "Password":"Пароль", "question_text": 'Или ответ на "{q}"',
        "Toggle navigation": "Переключить навигацию", "About site": "О сайте",
        "Search": "Поиск", "Other":"Другое", "Type": "Тип", 
        "Information": "Информация", "Record types": "Типы записей",
        "Number of record types:": "Количество типов записей:",
        "Number of tags:": "Количество тегов:", "Convectors": "Конвекторы",
        "Number of records:": "Количество записей: ", 
        "Load data type": "Загрузить тип данных",
        reboot_message: "Эти настройки будут применены только после перезагрузки",
        "Integration with Google Drive": "Интеграция с Google Drive", 
        "Synchronization interval (minutes)": "Интервал синхронизации (минуты)",
        "Delete from GD": "Удалить с GD", "Front page": "Первая страница",
        "Install/change/uninstall": "Установить/сменить/удалить",
        "Local data": "Локальные данные", "Export": "Экспортировать",
        "Import": "Импортировать",  "version": "Версия: {v}",
        "Source Code": "Исходный код", "Documentation": "Документация", 
        browser_support: "Создатель сайта не ставил целью поддержку старых браузеров.",
        disclaimer: "Сайт не несет ответственности, ни за что.", 
    }
};
Object.keys(messages.ru).filter(i => !(messages.en[i]))
    .forEach(i => messages.en[i] = i);

const i18n = VueI18n.createI18n({
    locale: window.navigator.language.slice(0, 2),
    fallbackLocale: 'en',
    messages,
});

function GetUUID4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => c ^
        crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16);
};

async function convertFromUniversumToMydiary(files) {
    const universumMydiaryConvestors = {
        "3": {
            "ru.schustovd.diary.api.CommentMark": data => ({
                "$type": "1bb116ac-697a-11eb-ac85-c0e434b07c91",
                "$tags": getHashtags(data["comment"]),
                "text": data["comment"],
            }),
            "ru.schustovd.diary.api.RateMark": data => ({
                "$type": "3838c06e-7b72-11eb-b8d8-c0e434b07c91",
                "rate": ({
                    3: 5,
                    5: 4,
                    2: 3,
                    4: 2,
                    1: 1
                })[data["grade"]],
            }),
            "ru.schustovd.diary.api.IdeaMark": data => ({
                "$type": "4f3e74c0-beca-4d91-8b37-0d8af574afd7",
                "$tags": getHashtags(data["comment"]),
                "text": data["comment"],
            }),
            "ru.schustovd.diary.api.TaskMark": data => ({
                "$type": "5e5a8960-6e2b-11eb-b6df-c0e434b07c91",
                "$tags": getHashtags(data["comment"], data["conclusion"]),
                "text": data["comment"],
                "isDone": data["done"],
                "conclusion": data["conclusion"],
            }),
        },
    };
    const text = await files[Object.keys(files)[0]].text();
    const data = JSON.parse(text);
    delete files[Object.keys(files)[0]];
    const newData = {
        records: [],
        version: "5",
    };
    data.marks.forEach(i => {
        const convector = universumMydiaryConvestors[data["version"]][i.type];
        if (convector) {
            const record = {
                $id: i["id"],
                $created: i["created"],
                $changed: i["changed"] > 0 ? i["changed"] : i["created"],
                $date: i["date"],
                $time: i["time"].slice(null, -3),
                ...convector(i, files),
            };
            newData.records.push(record);
        };
    });
    files["data.json"] = new File([JSON.stringify(newData)], "data.json");
    return files;
};

async function convertFromMydiaryToUniversum(files) {
    const mydiaryUniversumConvestors = {
        "5": {
            "1bb116ac-697a-11eb-ac85-c0e434b07c91": data => ({
                "type": "ru.schustovd.diary.api.CommentMark",
                "comment": data["text"],
            }),
            "1fb116ac-697a-11eb-ac85-c0e434b07c91": d => ({
                "type": "ru.schustovd.diary.api.CommentMark",
                "comment": d["description"]+"\n"+htmlToText(d["content"]),
            }),
            "3838c06e-7b72-11eb-b8d8-c0e434b07c91": data => ({
                "type": "ru.schustovd.diary.api.RateMark",
                "grade": ({
                    5: 3,
                    4: 5,
                    3: 2,
                    2: 4,
                    1: 1
                })[data["rate"]],
            }),
            "4f3e74c0-beca-4d91-8b37-0d8af574afd7": data => ({
                "type": "ru.schustovd.diary.api.IdeaMark",
                "comment": data["text"],
            }),
            "5e5a8960-6e2b-11eb-b6df-c0e434b07c91": data => ({
                "type": "ru.schustovd.diary.api.TaskMark",
                "conclusion": data["conclusion"],
                "comment": data["text"],
                "done": data["isDone"],
            }),
        },
    };
    const text = await files[Object.keys(files)[0]].text();
    const data = JSON.parse(text);
    delete files[Object.keys(files)[0]];
    const newData = {
        version: "3",
        marks: [],
        recurrences: []
    };
    data.records.forEach(i => {
        convector = mydiaryUniversumConvestors[data["version"]][i.$type];
        if (convector) {
            const record = {
                ...convector(i, files),
                id: GetUUID4(),
                created: i["$created"],
                changed: i["$changed"],
                time: i["$time"] + ":00",
                date: i["$date"],
            };
            newData.marks.push(record);
        };
    });
    files["data.pr"] = new File([JSON.stringify(newData)], "data.pr");
    return files;
};

CONVECTORS = {
    universum: {
        mydiary: convertFromUniversumToMydiary,
    },
    mydiary: {
        universum: convertFromMydiaryToUniversum,
    },
};

async function convert(from, to, files) {
    return from == to ? files : CONVECTORS[from][to](files);
};

const vueApp = Vue.createApp({
    data: () => ({
        fromType: "universum",
        toType: "mydiary",
        convectorsTypes: {
            "universum": "Универсум",
            "mydiary": "Мой дневник",
        },
    }),
    methods: {
        async startConvector() {
            await Processes.fun(async () => {
                let files = await getFile();
                files = {
                    [Object.values(files)[0].name]: Object.values(files)[0]
                };
                files = await convert(this.fromType, this.toType, files);
                giveFile(Object.values(files)[0]);
            });
        },
    },
});

vueApp.use(i18n);
vueApp.mount("#app");