import test from 'ava';

import { getDomainFromUrl, getBaseDomainFromUrl } from './helpers';

test('getDomainFromUrl', (t) => {
    t.is(getDomainFromUrl('https://www.example.com'), 'www.example.com');
    t.is(getDomainFromUrl('http://www.example.com'), 'www.example.com');
    t.is(getDomainFromUrl('https://example.com'), 'example.com');
    t.is(getDomainFromUrl('http://example.com'), 'example.com');
    t.is(getDomainFromUrl('https://www.example.co.uk'), 'www.example.co.uk');
    t.is(getDomainFromUrl('http://www.example.co.uk'), 'www.example.co.uk');
    t.is(getDomainFromUrl('https://example.co.uk'), 'example.co.uk');
    t.is(getDomainFromUrl('http://example.co.uk'), 'example.co.uk');
    t.is(getDomainFromUrl('https://subdomain.example.com'), 'subdomain.example.com');
    t.is(getDomainFromUrl('http://subdomain.example.com'), 'subdomain.example.com');
});

test('getBaseDomainFromUrl', (t) => {
    t.is(getBaseDomainFromUrl('https://www.example.com'), 'example.com');
    t.is(getBaseDomainFromUrl('http://www.example.com'), 'example.com');
    t.is(getBaseDomainFromUrl('https://example.com'), 'example.com');
    t.is(getBaseDomainFromUrl('http://example.com'), 'example.com');
    t.is(getBaseDomainFromUrl('https://www.example.co.uk'), 'example.co.uk');
    t.is(getBaseDomainFromUrl('http://www.example.co.uk'), 'example.co.uk');
    t.is(getBaseDomainFromUrl('https://example.co.uk'), 'example.co.uk');
    t.is(getBaseDomainFromUrl('http://example.co.uk'), 'example.co.uk');
    t.is(getBaseDomainFromUrl('https://subdomain.example.com'), 'example.com');
    t.is(getBaseDomainFromUrl('http://subdomain.example.com'), 'example.com');
});
