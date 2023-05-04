import test from 'ava';
import { Protocol } from 'devtools-protocol';
import Cookie = Protocol.Network.Cookie;
import { InMemoryStorage } from './inMemoryStorage';

test('InMemoryStorage: load and save LocalStorageData', async t => {
    const inMemoryStorage = new InMemoryStorage();

    const localStorageData = {
        'example.com': {
            key1: 'value1',
            key2: 'value2'
        }
    };

    await inMemoryStorage.saveLocalStorageData(localStorageData);
    const loadedData = await inMemoryStorage.loadLocalStorageData();

    t.deepEqual(loadedData, localStorageData);
});

test('InMemoryStorage: load and save Cookies', async t => {
    const inMemoryStorage = new InMemoryStorage();

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

    await inMemoryStorage.saveCookies(cookies);
    const loadedCookies = await inMemoryStorage.loadCookies();

    t.deepEqual(loadedCookies, cookies);
});
