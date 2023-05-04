import {PluginData, PuppeteerExtraPlugin} from 'puppeteer-extra-plugin';
import {Page, HTTPResponse} from 'puppeteer';
import {
    Storage,
    PluginOptions,
    LocalStorageData,createStorage,
    Cookie,
} from './types';
import {FileSystemStorage} from './storage/fileSystemStorage';
import {Protocol} from 'devtools-protocol';
import CookieSourceScheme = Protocol.Network.CookieSourceScheme;
import CookiePriority = Protocol.Network.CookiePriority;


/**
 * Persist sessions in puppeteer. This plugin will save/load the cookies and localStorage from different storage engines.
 *
 * @function
 * @param {Object} opts - Options
 * @param {boolean} [opts.persistCookies=true] - Allow or disallow cookies persistence.
 * @param {boolean} [opts.persistLocalStorage=true] - Allow or disallow local storage persistence.
 * @param {StorageConfig} [opts.storage] - Storage options. Default to filesystem storage.
 * @param {LocalStorageData} [localStorageData={}] - Local storage data to load.
 * @param {Cookie[]} [cookies=[]] - Cookies to load.
 * @returns {Object} The puppeteer-extra-plugin-session-persistence instance.
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-session-persistence')())
 * // or
 * puppeteer.use(require('puppeteer-extra-plugin-session-persistence')({
 *   persistCookies: true,
 *   persistLocalStorage: true,
 *   storage: {
 *     name: 'redis',
 *     options: {
 *       host: 'localhost',
 *       port: 6379
 *     }
 *   }
 * }))
 * const browser = await puppeteer.launch()
 */
export class PuppeteerExtraPluginSessionPersistence extends PuppeteerExtraPlugin {
    private localStorageData: LocalStorageData = {};
    private cookies: Cookie[] = [];
    private storage: Storage;

    constructor(opts: Partial<PluginOptions>, localStorageData: LocalStorageData = {}, cookies: Cookie[] = []) {
        super(opts)
        this.storage = opts.storage ? createStorage(opts.storage) : new FileSystemStorage();
        this.localStorageData = localStorageData;
        this.cookies = cookies;
        this.debug('constructor', {opts: this.opts, localStorageData: this.localStorageData, cookies: this.cookies});
    }

    get name() {
        return 'session-persistence'
    }

    // todo: make a PR to puppeteer-extra to change the PluginData interface, name and value should not be an object but any instead.
    get data(): PluginData[] {
        return [
            {
                name: {
                    name: 'cookies'
                },
                value: {
                    value: this.cookies
                }
            },
            {
                name: {
                    name: 'localStorageData'
                },
                value: {
                    value: this.localStorageData
                }
            }
        ]
    }

    get defaults(): PluginOptions {
        return {
            persistCookies: true,
            persistLocalStorage: true,
            storage: {
                name: "filesystem",
                options: {},
            },
        }
    }

    async onPluginRegistered() {
        this.debug('onPluginRegistered');
        await this.loadCookies();
        await this.loadLocalStorageData();
        this.debug('onPluginRegistered ended', {localStorageData: this.localStorageData});
    }

    async onClose() {
        this.debug('onClose', {localStorageData: this.localStorageData});
        if (this.opts.persistCookies) {
            await this.saveCookies();
        }
        if (this.opts.persistLocalStorage) {
            await this.saveLocalStorageData();
        }
    }

    // loadLocalStorageData loads the localStorage data from the localStorageData file, if the file does not exist, it will try to create it.
    // It also merges the localStorageData from the file with the localStorageData from the constructor if any localStorageData are given.
    loadLocalStorageData() {
        this.debug('loadLocalStorageData');
        this.localStorageData = {...this.storage.loadLocalStorageData(), ...this.localStorageData};
    }


    // saveLocalStorageData saves the localStorage data to the localStorageData file.
    async saveLocalStorageData() {
        this.debug('saveLocalStorageData');
        await this.storage.saveLocalStorageData(this.localStorageData);
    }

    // loadCookies loads the cookies from the cookies file, if the file does not exist, it will try to create it.
    // It also merges the cookies from the file with the cookies from the constructor if any cookies are given.
    async loadCookies() {
        this.debug('loadCookies');
        try {
            const cookies = await this.storage.loadCookies();
            this.mergeCookies(cookies);
            this.debug('loadCookies loaded', {cookies: this.cookies});
        } catch (err) {
            this.debug('loadCookies ended with error', {err});
            await this.saveCookies();
        }
    }

    // saveCookies saves the cookies to the cookies file.
    async saveCookies() {
        this.debug('saveCookies');
        await this.storage.saveCookies(this.cookies);
    }

    async setPageCookies(page: Page) {
        this.debug('setPageCookies');
        const pageTarget = page.target();
        const client = await pageTarget.createCDPSession();
        await client.send('Network.setCookies', {cookies: this.cookies});
    }

    async extractCookiesFromResponse(cookies: string, url: string): Promise<Cookie[]> {
        this.debug('extractCookiesFromResponse', cookies.toString());

        const cookiesArray = cookies.split(/,(?=\s\S+=\S+)/);

        return cookiesArray.map((cookie: string) => {
            const cookieParts = cookie.split(';');
            const parsedCookie = cookieParts[0].split('=');
            const domain = url.split('/')[2];

            let expires = 0;
            let httpOnly = false;
            let secure = false;
            let session = false;
            let path = '/';
            let sameSite: 'Lax' | 'Strict' | 'None' = 'Lax';
            let sameParty = false;
            let sourceScheme = 'Secure';
            let sourcePort = 443;
            let priority = 'Low';

            cookieParts.slice(1).forEach((part) => {
                const [key, value] = part.trim().split('=');

                switch (key.toLowerCase()) {
                    case 'expires':
                        expires = value ? new Date(value).getTime() : 0;
                        break;
                    case 'path':
                        path = value;
                        break;
                    case 'httponly':
                        httpOnly = true;
                        break;
                    case 'secure':
                        secure = true;
                        break;
                    case 'samesite':
                        sameSite = value as 'Lax' | 'Strict' | 'None';
                        break;
                    case 'sameparty':
                        sameParty = true;
                        break;
                    case 'sourcescheme':
                        sourceScheme = value || 'Secure';
                        break;
                    case 'sourceport':
                        sourcePort = parseInt(value, 10) || 443;
                        break;
                    case 'priority':
                        priority = value || 'Low';
                        break;
                }
            });

            const newCookie: Cookie = {
                name: parsedCookie[0].trim(),
                value: parsedCookie[1],
                domain: domain,
                path: path,
                expires: expires,
                size: cookie.length,
                httpOnly: httpOnly,
                secure: secure,
                session: session,
                sameSite: sameSite,
                sameParty: sameParty,
                sourceScheme: sourceScheme as CookieSourceScheme,
                sourcePort: sourcePort,
                priority: priority as CookiePriority,
            };

            return newCookie;
        });
    };

    async onResponseReceived(response: HTTPResponse) {
        this.debug('onResponseReceived', {response});
        const headers = response.headers();
        const cookies = headers['set-cookie'];
        if (cookies) {
            const parsedCookies = await this.extractCookiesFromResponse(cookies, response.url());
            await this.mergeCookies(parsedCookies);
        }
    }

    // mergeCookies merges the cookies we have with incoming cookies.
    // the farthest cookies with expiration date will remain if there are duplicates.
    mergeCookies(cookies: Cookie[]) {
        const cookieMap = new Map<string, Cookie>();

        for (const cookie of this.cookies) {
            const key = `${cookie.domain}-${cookie.name}`;
            cookieMap.set(key, cookie);
        }

        for (const cookie of cookies) {
            const key = `${cookie.domain}-${cookie.name}`;
            const existingCookie = cookieMap.get(key);

            if (existingCookie) {
                const existingExpires = new Date(existingCookie.expires || 0);
                const newExpires = new Date(cookie.expires || 0);

                if (newExpires > existingExpires) {
                    cookieMap.set(key, cookie);
                }
            } else {
                cookieMap.set(key, cookie);
            }
        }

        this.cookies = Array.from(cookieMap.values());
    }

    async onFrameNavigated(page: Page) {
        this.debug('onFrameNavigated');
        const domainUrl = this.getDomainFromUrl(page.url());

        try {
            await this.setLocalStorageValues(page, domainUrl);
            await this.updateLocalStorageData(page, domainUrl);
        } catch (error) {
            this.debug('onFrameNavigated error with localStorage', {error});
        }

        try {
            await this.mergePageCookies(page);
        } catch (error) {
            this.debug('onFrameNavigated error with cookies', {error});
        }
    }

    async setLocalStorageValues(page: Page, domainUrl: string) {
        for (const key in this.localStorageData[domainUrl]) {
            if (this.localStorageData[domainUrl].hasOwnProperty(key)) {
                const value = this.localStorageData[domainUrl][key];
                this.debug('setLocalStorageValues', {key, value});
                await page.evaluate((key: string, value: string) => {
                    localStorage.setItem(key, value);
                }, key, value);
            }
        }
    }

    async updateLocalStorageData(page: Page, domainUrl: string) {
        const localStorageAccessible = await page.evaluate(() => {
            try {
                return !!window.localStorage;
            } catch (error) {
                return false;
            }
        });

        if (localStorageAccessible) {
            this.debug('onFrameNavigated localStorage accessible');
            const localStorageData = await page.evaluate(() => {
                const data: { [key: string]: string | null } = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        data[key] = localStorage.getItem(key);
                    }
                }
                return data;
            });
            this.localStorageData[domainUrl] = {...this.localStorageData[domainUrl], ...localStorageData};
        } else {
            this.debug('onFrameNavigated localStorage not accessible');
        }
    }

    async mergePageCookies(page: Page) {
        const pageTarget = page.target();
        const client = await pageTarget.createCDPSession();
        const cookies = await client.send('Network.getAllCookies');
        this.debug('onRequestFinished merging cookies');
        this.mergeCookies(cookies.cookies);
    }

    getDomainFromUrl(url: string): string {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname;
        } catch (error) {
            this.debug('getDomainFromUrl error', {error});
            return '';
        }
    }

    // onPageCreated create all the event listeners for the page.
    onPageCreated = async (page: Page) => {
        this.debug('onPageCreated adding event listeners');
        await page.setBypassCSP(true);
        page.on('framenavigated', () => this.onFrameNavigated(page));
        page.on('response', this.onResponseReceived.bind(this));
        await this.setPageCookies(page);
    };
}