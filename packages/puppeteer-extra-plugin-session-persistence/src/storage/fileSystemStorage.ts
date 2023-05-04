import {FileSystemStorageOptions, LocalStorageData, Storage} from "../types";
import fs from "fs";
import {Protocol} from 'devtools-protocol';
import Cookie = Protocol.Network.Cookie;


export class FileSystemStorage implements Storage {
    private localStorageDataFile: string;
    private cookiesFile: string;

    get name() {
        return 'file-system';
    }

    constructor(fileSystemStorageOptions: FileSystemStorageOptions = {}) {
        this.localStorageDataFile = fileSystemStorageOptions.localStorageDataFile || './localStorageData.json';
        this.cookiesFile = fileSystemStorageOptions.cookiesFile || './cookies.json';
    }

    async loadLocalStorageData(): Promise<LocalStorageData> {
        try {
            const localStorageDataLoaded = fs.readFileSync(this.localStorageDataFile);
            return JSON.parse(localStorageDataLoaded.toString());
        } catch (err) {
            await this.saveLocalStorageData({});
        }

        return {};
    }

    async saveLocalStorageData(data: LocalStorageData): Promise<void> {
        fs.writeFileSync(this.localStorageDataFile, JSON.stringify(data));
    }

    async loadCookies(): Promise<Cookie[]> {
        try {
            const cookiesLoaded = fs.readFileSync(this.cookiesFile);
            return JSON.parse(cookiesLoaded.toString());
        } catch (err) {
            await this.saveCookies([]);
        }

        return [];
    }

    async saveCookies(cookies: Cookie[]): Promise<void> {
        fs.writeFileSync(this.cookiesFile, JSON.stringify(cookies));
    }
}