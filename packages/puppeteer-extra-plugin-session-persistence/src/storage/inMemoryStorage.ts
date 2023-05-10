import {LocalStorageData, Storage} from "../types";
import {Protocol} from 'devtools-protocol';
import Cookie = Protocol.Network.Cookie;

export class InMemoryStorage implements Storage {
    private localStorageData: Map<string, { [key: string]: any }> = new Map();
    private cookies: Cookie[] = [];

    get name() {
        return 'in-memory';
    }

    async loadLocalStorageData(): Promise<LocalStorageData> {
        const result: { [domain: string]: { [key: string]: any } } = {};

        this.localStorageData.forEach((value, key) => {
            result[key] = {...value};
        });

        return result;
    }

    async saveLocalStorageData(data: LocalStorageData): Promise<void> {
        for (const domain in data) {
            this.localStorageData.set(domain, {...data[domain]});
        }
    }

    async loadCookies(): Promise<Cookie[]> {
        return [...this.cookies];
    }

    async saveCookies(cookies: Cookie[]): Promise<void> {
        this.cookies = [...cookies];
    }
}