import test from 'ava';
import { createStorage, StorageConfig } from './types';
import { RedisStorage } from './storage/redisStorage';
import { FileSystemStorage } from './storage/fileSystemStorage';
import { InMemoryStorage } from './storage/inMemoryStorage';

test('createStorage should create RedisStorage instance', (t) => {
    const config: StorageConfig = {
        name: RedisStorage.name.toLowerCase(),
        options: {
            host: 'localhost',
            port: 6379,
            password: 'password',
        },
    };

    const storage = createStorage(config);
    t.true(storage instanceof RedisStorage);
});

test('createStorage should create FileSystemStorage instance', (t) => {
    const config: StorageConfig = {
        name: FileSystemStorage.name.toLowerCase(),
        options: {
            localStorageDataFile: 'localStorageData.json',
            cookiesFile: 'cookies.json',
        },
    };

    const storage = createStorage(config);
    t.true(storage instanceof FileSystemStorage);
});

test('createStorage should create InMemoryStorage instance', (t) => {
    const config: StorageConfig = {
        name: InMemoryStorage.name.toLowerCase(),
        options: undefined,
    };

    const storage = createStorage(config);
    t.true(storage instanceof InMemoryStorage);
});

test('createStorage should throw an error for unknown storage name', (t) => {
    const config: StorageConfig = {
        name: 'unknown',
        options: undefined,
    };

    const error = t.throws(() => {
        createStorage(config);
    });

    t.is(error.message, 'Unknown storage name: unknown');
});
