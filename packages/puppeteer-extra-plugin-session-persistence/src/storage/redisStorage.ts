import {LocalStorageData, RedisClientTypeCustom, RedisStorageOptions, Storage} from "../types";
import {createClient} from "redis";
import {Protocol} from 'devtools-protocol';
import Cookie = Protocol.Network.Cookie;

export class RedisStorage implements Storage {
    private client: RedisClientTypeCustom;

    constructor(options: RedisStorageOptions = {}, client?: RedisClientTypeCustom) {
        this.client = client || createClient(options);
    }

    get name() {
        return 'redis';
    }

    async loadLocalStorageData(): Promise<LocalStorageData> {
        let localStorageData: LocalStorageData = {};

        const localStorageDataStr = await this.client.get('localStorageData');
        if (!localStorageDataStr) {
            return localStorageData;
        }

        return JSON.parse(localStorageDataStr) as LocalStorageData;
    }

    async saveLocalStorageData(data: LocalStorageData): Promise<void> {
        await this.client.set('localStorageData', JSON.stringify(data));
    }

    async loadCookies(): Promise<Cookie[]> {
        let cookies: Cookie[] = [];

        const cookiesStr = await this.client.get('cookies');
        if (!cookiesStr) {
            return cookies;
        }

        return JSON.parse(cookiesStr) as Cookie[];
    }

    async saveCookies(cookies: Cookie[]): Promise<void> {
        await this.client.set('cookies', JSON.stringify(cookies));
    }
}
