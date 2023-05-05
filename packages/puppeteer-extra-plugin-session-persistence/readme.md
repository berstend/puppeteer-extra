# Puppeteer Extra Plugin Session Persistence

This TypeScript library provides a Puppeteer Extra plugin for persisting sessions in Puppeteer. It saves and loads cookies and localStorage data from different storage engines.

## Features

- Save and load cookies and localStorage data
- Supports different storage engines (default: filesystem)
- Merge cookies and localStorage data from constructor and storage
- Automatically set cookies and localStorage data when a new page is created

## Installation

```bash
npm install puppeteer-extra-plugin-session-persistence
```

## Usage

```javascript
const puppeteer = require('puppeteer-extra')
puppeteer.use(require('puppeteer-extra-plugin-session-persistence')())
// or
puppeteer.use(require('puppeteer-extra-plugin-session-persistence')({
  persistCookies: true,
  persistLocalStorage: true,
  storage: {
    name: 'filesystem',
    options: {
      localStorageDataFile: './localStorageData.json',
      cookiesFile: './cookies.json'
    }
  }
}))
const browser = await puppeteer.launch()
```

## Options

- `persistCookies` (boolean, default: true): Allow or disallow cookies persistence.
- `persistLocalStorage` (boolean, default: true): Allow or disallow local storage persistence.
- `storage` (StorageConfig, default: filesystem storage): Storage options.
- `localStorageData` (LocalStorageData, default: {}): Local storage data to load.
- `cookies` (Cookie[], default: []): Cookies to load.

## Storage Engines

The plugin supports different storage engines for persisting session data:

- File System Storage (default)
- Redis Storage
- In-Memory Storage

To use a specific storage engine, pass the corresponding configuration object to the plugin constructor. For example, to use Redis storage:

```javascript
puppeteer.use(require('puppeteer-extra-plugin-session-persistence')({
  storage: {
    name: 'redis',
    options: {
      host: 'localhost',
      port: 6379
    }
  }
}))
```

## License

This library is released under the MIT License.