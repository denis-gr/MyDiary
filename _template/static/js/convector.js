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
    const text = await files["data.pr"].text();
    const data = JSON.parse(text);
    delete files["data.pr"];
    const newData = {
        records: [],
        version: "5",
    };
    data.marks.forEach(i => {
        const convector = universumMydiaryConvestors[data["version"]][i.type];
        if (convector) {
            const record = {
                $created: i["created"],
                $changed: i["changed"],
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
    const text = await files["data.json"].text();
    const data = JSON.parse(text);
    delete files["data.json"];
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

vueApp.mount("#app");