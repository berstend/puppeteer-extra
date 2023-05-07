import debug from "debug";

const psl = require('psl');

export function getDomainFromUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch (error) {
        debug(`puppeteer-extra-plugin:session-persistence`).log('getDomainFromUrl() Error parsing url', url, error);
        return '';
    }
}

export function getBaseDomainFromUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        const parsedDomain = psl.parse(parsedUrl.hostname);
        return parsedDomain.domain || '';
    } catch (error) {
        debug(`puppeteer-extra-plugin:session-persistence`).log('getBaseDomainFromUrl() Error parsing url', url, error);
        return '';
    }
}