class ProcessesClass {
    constructor() {
        this._promice = Promise.resolve(null);
        this._count = 0;
        this._listeners = [];
    };
    add(promice) {
        this._count += 1;
        this._listeners.forEach(i => i(this.isBusy));
        this._promice = this._promice
            .then(async () => {
                try {
                    await promice;
                } catch (error) {
                    this._error(error);
                };
            }).then(() => this._count--)
            .then(() => this._listeners.forEach(i => i(this.isBusy)));
        return promice;
    };
    fun(fun) {
        return this.add(fun());
    };
    get promice() {
        return this._promice;
    };
    get isBusy() {
        return this._count > 0;
    };
    _error(reason) {
        console.log("Error: " + reason);
        alert("Error: " + reason);
    };
    addListener(fun) {
        this._listeners.push(fun);
    };
};

async function getPasswordHash(password) {
    password = strToAB(password);
    password = await crypto.subtle.digest("SHA-512", password);
    password = await crypto.subtle.digest("SHA-512", password);
    password = await crypto.subtle.digest("SHA-512", password);
    return ABToStr(password);
};

async function getFile(multiple, accept) {
    const el = document.createElement("input");
    el.setAttribute("type", "file");
    el.setAttribute("accept", accept);
    el.setAttribute("multiple", multiple);
    return new Promise(resolve => {
        el.onchange = () => resolve(el.files);
        el.click();
    });
};

function giveFile(file, name) {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.setAttribute('download', name || file.name);
    link.setAttribute('href', url);
    link.click();
    URL.revokeObjectURL(file);
};

async function getDays(year, month) {
    const date = (year && month) ? new Date(year, month - 1, 1) : new Date();
    const date1 = new Date(date);
    date1.setDate(1);
    if (date1.getDay() != 1) {
        date1.setDate(0);
        date1.setDate(date1.getDate() - date1.getDay() + 1);
    };
    const date2 = new Date(date);
    date2.setMonth(date2.getMonth() + 1);
    date2.setDate(0);
    if (date2.getDay() != 0) {
        date2.setDate(date2.getDate() + 7 - date2.getDay());
    };
    const days = [];
    let i = 0;
    while (date1 <= date2) {
        if (Math.floor(i % 7) == 0) {
            days.push([]);
        };
        days[Math.floor(i / 7)].push(new Date(date1));
        date1.setDate(date1.getDate() + 1);
        i++;
    };
    return days;
};

function getHashtags(...texts) {
    let tags = texts.join(" ").match(/#[^\s#]+/g);
    tags = (tags || []).map(x => x.slice(1));
    return [...new Set(tags)];
};

function htmlToText(html) {
    let temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
};

function ABToStr(buf) {
    const bufView = new Int16Array(buf);
    return Array.from(bufView).map(i => String.fromCharCode(i)).join("");
};

function strToAB(str) {
    const buf = new ArrayBuffer(str.length * 2);
    const bufView = new Int16Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    };
    return buf;
};

async function encrypt(password, data) {
    const name = "AES-GCM";
    password = strToAB(password);
    password = await crypto.subtle.digest("SHA-256", password);
    const key = await crypto.subtle.importKey("raw", password, { name },
        true, ["encrypt"]);
    let iv = crypto.getRandomValues(new Uint16Array(6));
    data = await crypto.subtle.encrypt({ name, iv }, key, data);
    iv = ABToStr(iv);
    return { data, iv };
};

async function decrypt(password, iv, data) {
    const name = "AES-GCM";
    iv = strToAB(iv);
    password = strToAB(password);
    password = await crypto.subtle.digest("SHA-256", password);
    const key = await crypto.subtle.importKey("raw", password, { name },
        true,["decrypt"]);
    data = await crypto.subtle.decrypt({ name, iv }, key, data);
    return data;
};

if (window.moment) {
    moment.locale(window.navigator.language.slice(null, 2));
};

window.onbeforeunload = function() {
    return Processes.isBusy ? "Busy" : null;
};

const settings = (function() {
    if (!localStorage.settings) {
        localStorage.settings = JSON.stringify({
            isUseGD: false,
            syncInterval: 1000 * 60 * 3,
        });        
    };
    return {
        get(name) {
            return JSON.parse(localStorage.settings)[name];
        },
        set(name, value) {
            localStorage.settings = JSON.stringify(
                { ...JSON.parse(localStorage.settings), [name]: value });
        },
    };
})();

const INVALIDPASSWORD = "Invalid password";
const Processes = new ProcessesClass();
