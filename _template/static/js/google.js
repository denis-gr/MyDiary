const CLIENT_ID = '976940086540-l613qtngm1hbp54h0rtma22d446pg77u.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAhnjlS-uTz4K4g1yJUUJORinikioVRSOI';
const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];
const SCOPES = [
    'https://www.googleapis.com/auth/drive.appdata',
].join(" ");

const login = () => gapi.auth2.getAuthInstance().signIn();
const logout = () => gapi.auth2.getAuthInstance().signOut();

class GDDBClass {
    constructor(callback) {
        this._callback = callback;
        this._promise = this._fun();
    };
    async _fun() {
        gapi.load('client:auth2', () => this._init());
        await new Promise(resolve => {
            const timerId = setInterval(() => {
                try {
                    gapi.client.drive.files;
                    clearInterval(timerId);
                    resolve();
                } catch {};
            }, 100);
        });
    };
    async _init() {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        });
        gapi.auth2.getAuthInstance().isSignedIn.listen(this._callback);
        this._callback(gapi.auth2.getAuthInstance().isSignedIn.get());
    };
    async addFile(name, mimeType, parent) {
        await this._promise;
        const resp = await gapi.client.drive.files.create({
            resource: { name, mimeType, parents: [parent || 'appDataFolder'] },
            fields: 'id'
        });
        return resp.result.id
    };
    async uploadText(fileId, content) {
        await this._promise;
        return gapi.client.request({
            path: `/upload/drive/v3/files/${fileId}`,
            method: 'PATCH',
            params: { uploadType: 'media' },
            body: content,
        });
    };
    async downloadText(fileId) {
        await this._promise;
        return (await gapi.client.drive.files.get({fileId, alt:'media'})).body;
    };
    async find(q) {
        await this._promise;
        return (await gapi.client.drive.files.list({ spaces: 'appDataFolder',
            fields: 'files(id, name)', q })).result.files;
    };
    async deleteFile(fileId) {
        await this._promise;
        return gapi.client.drive.files.delete({ fileId });
    };
    async getDir(path, rootPath) {
        await this._promise;
        const dt = "application/vnd.google-apps.folder";
        const d = path.split("/");
        let id = rootPath || 'appDataFolder';
        for (let i in d) {
            const res = await this.find(["name='", d[i], "'and parents in '",
                id, "' and mimeType='", dt, "'"].join(""));
            id = res.length ? res[0].id : await this.addFile(d[i], dt, id);
        };
        return id;
    };
    async deleteFromGD() {
        await this._promise;
        await this.deleteFile(await this.getDir("DB"));
    };
    async exportToGD(files) {
        await this._promise;
        const root = await this.getDir("DB");
        const filename = new Date().toISOString() + ".json";
        const temp = await this.addFile(filename, "application/json", root);
        await this.uploadText(temp, await files["data.json"].text());
    };
    async importFromGD() {
        await this._promise;
        const root = await this.getDir("DB");
        let files = await this.find(
            "parents in '" + root + "' and mimeType = 'application/json'");
        files.sort((a, b) => a.name == b.name ? 0 : (a.name > b.name ? -1 : 1));
        let data = '{"records":[],"version":"5.1"}';
        for (let i in files) {
            const temp = await this.downloadText(files[i].id);
            try {
                JSON.parse(temp);
                data = temp;
                break
            } catch {}
        };
        return {"data.json": new File([data], "data.json")};
    };
};
