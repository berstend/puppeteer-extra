import { Protocol } from 'devtools-protocol';
import Cookie = Protocol.Network.Cookie;
import {SetOptions} from "redis";

export interface Storage {
    loadLocalStorageData(): Promise<LocalStorageData>;
    saveLocalStorageData(data: LocalStorageData): Promise<void>;
    loadCookies(): Promise<Cookie[]>;
    saveCookies(cookies: Cookie[]): Promise<void>;
    name: string;
}

export interface RedisClientTypeCustom {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, options?: SetOptions) => Promise<string | null>;
}

export interface RedisStorageOptions {
    host?: string;
    port?: number;
    password?: string;
}

export interface FileSystemStorageOptions {
    localStorageDataFile?: string;
    cookiesFile?: string;
}

export type RedisStorageConfig = {
    name: 'redis';
    options: RedisStorageOptions;
};

export type FileSystemStorageConfig = {
    name: 'filesystem';
    options: FileSystemStorageOptions;
};

export interface PluginOptions {
    persistCookies?: boolean;
    persistLocalStorage?: boolean;
    storage: RedisStorageConfig | FileSystemStorageConfig;
}

export interface LocalStorageData {
    [domain: string]: { [key: string]: any };
}
