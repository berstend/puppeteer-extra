import test from 'ava';
import { Protocol } from 'devtools-protocol';
import Cookie = Protocol.Network.Cookie;
import { RedisStorage } from './redisStorage';

// Create a factory function to generate the mockRedisClient with a custom get method and a temporary storage
const createMockRedisClient = () => {
    let tempStorage: Record<string, string> = {};

    return {
        get: async (key: string) => {
            return tempStorage[key];
        },
        set: async (key: string, value: string) => {
            tempStorage[key] = value;
            return 'OK';
        },
        // Method to access the temporary storage for testing purposes
        getTempStorage: () => tempStorage,
        flushTempStorage: () => {
            tempStorage = {};
        }
    };
};

const mockRedisClient = createMockRedisClient();

test.afterEach(() => {
    // Clean up temporary storage after each test
    mockRedisClient.flushTempStorage();
});

test('RedisStorage: load and save LocalStorageData', async t => {
    const redisStorage = new RedisStorage({}, mockRedisClient);

    const localStorageData = {
        'example.com': {
            key1: 'value1',
            key2: 'value2'
        }
    };

    await redisStorage.saveLocalStorageData(localStorageData);
    const loadedData = await redisStorage.loadLocalStorageData();

    t.deepEqual(loadedData, localStorageData);
});

test('RedisStorage: load and save Cookies', async t => {
    const redisStorage = new RedisStorage({}, mockRedisClient);

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

    await redisStorage.saveCookies(cookies);
    const loadedCookies = await redisStorage.loadCookies();

    t.deepEqual(loadedCookies, cookies);
});
