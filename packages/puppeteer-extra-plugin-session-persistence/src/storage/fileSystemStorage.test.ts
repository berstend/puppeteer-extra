import test from 'ava';
import fs from 'fs';
import { Protocol } from 'devtools-protocol';
import Cookie = Protocol.Network.Cookie;
import { FileSystemStorage } from './fileSystemStorage';

const localStorageDataFilePath = './testLocalStorageData.json';
const cookiesFilePath = './testCookies.json';

test.afterEach(() => {
    // Clean up files after each test
    if (fs.existsSync(localStorageDataFilePath)) {
        fs.unlinkSync(localStorageDataFilePath);
    }
    if (fs.existsSync(cookiesFilePath)) {
        fs.unlinkSync(cookiesFilePath);
    }
});

test('FileSystemStorage: load and save LocalStorageData', async t => {
    const fileSystemStorage = new FileSystemStorage({
        localStorageDataFile: localStorageDataFilePath
    });

    const localStorageData = {
        'example.com': {
            key1: 'value1',
            key2: 'value2'
        }
    };

    await fileSystemStorage.saveLocalStorageData(localStorageData);
    const loadedData = await fileSystemStorage.loadLocalStorageData();

    t.deepEqual(loadedData, localStorageData);
});

test('FileSystemStorage: load and save Cookies', async t => {
    const fileSystemStorage = new FileSystemStorage({
        cookiesFile: cookiesFilePath
    });

    const cookies: Cookie[] = [
        {
            name: 'cookie1',
            value: 'value1',
            domain: 'example.com',
            path: '/',
            expires: 1628770800,
            size: 10,
            httpOnly: false,
            secure: false,
            session: false,
            priority: 'Medium',
            sameParty: false,
            sourceScheme: 'Secure',
            sourcePort: 443,
        },
    ];

    await fileSystemStorage.saveCookies(cookies);
    const loadedCookies = await fileSystemStorage.loadCookies();

    t.deepEqual(loadedCookies, cookies);
});
