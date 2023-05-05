import {Protocol} from 'devtools-protocol';
import NetworkCookie = Protocol.Network.Cookie;
import {SetOptions} from "redis";
import {FileSystemStorage} from './storage/fileSystemStorage';
import {RedisStorage} from './storage/redisStorage';
import {InMemoryStorage} from './storage/inMemoryStorage';

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
    name: RedisStorage['name'];
    options: RedisStorageOptions;
};

export type FileSystemStorageConfig = {
    name: FileSystemStorage["name"];
    options: FileSystemStorageOptions;
};

export type InMemoryStorageConfig = {
    name: InMemoryStorage["name"];
    options: undefined;
};

export interface PluginOptions {
    persistCookies?: boolean;
    persistLocalStorage?: boolean;
    storage: StorageConfig;
}

export interface LocalStorageData {
    [domain: string]: { [key: string]: any };
}

export type StorageConfig = RedisStorageConfig | FileSystemStorageConfig | InMemoryStorageConfig;

export function createStorage(opts: StorageConfig) {
    switch (opts.name) {
        case RedisStorage.name.toLowerCase():
            return new RedisStorage(opts.options as RedisStorageOptions);
        case FileSystemStorage.name.toLowerCase():
            return new FileSystemStorage(opts.options as FileSystemStorageOptions);
        case InMemoryStorage.name.toLowerCase():
            return new InMemoryStorage();
    }

    return new FileSystemStorage();
}

export type Cookie = NetworkCookie;