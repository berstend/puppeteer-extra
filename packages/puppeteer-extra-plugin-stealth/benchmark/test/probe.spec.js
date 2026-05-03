const test = require('node:test')
const assert = require('node:assert/strict')
const {
  buildBrowserArgs,
  resolveTargetUrl,
  detectChallengeFromSnapshot
} = require('../probes/playwright-extra')

test('buildBrowserArgs does not force chrome channel unless configured', () => {
  const args = buildBrowserArgs({
    lane: { browser: { headless: true } },
    profileMode: { browser: {} }
  })
  assert.equal(args.headless, true)
  assert.equal('channel' in args, false)
})

test('buildBrowserArgs preserves explicit channel and proxy', () => {
  const args = buildBrowserArgs({
    lane: { browser: { headless: false, channel: 'chrome' }, proxyServer: 'socks5://127.0.0.1:7890' },
    profileMode: { browser: {} }
  })
  assert.equal(args.headless, false)
  assert.equal(args.channel, 'chrome')
  assert.deepEqual(args.proxy, { server: 'socks5://127.0.0.1:7890' })
})

test('resolveTargetUrl prefers flow-specific urls over the site root', () => {
  assert.equal(
    resolveTargetUrl({
      site: { url: 'https://example.com/' },
      flow: { url: 'https://example.com/search?q=test' }
    }),
    'https://example.com/search?q=test'
  )
})

test('detectChallengeFromSnapshot does not misclassify generic pages as cloudflare interstitials', () => {
  const challenge = detectChallengeFromSnapshot({
    title: 'GitHub',
    text: 'Welcome back',
    selectors: {
      turnstile: false,
      hcaptcha: false,
      recaptcha: false,
      cloudflareInterstitial: false
    },
    siteKeys: {}
  })

  assert.equal(challenge, null)
})

test('detectChallengeFromSnapshot prefers hcaptcha over recaptcha compatibility markers', () => {
  const challenge = detectChallengeFromSnapshot({
    title: 'hCAPTCHA Demo',
    text: 'hCaptcha implementation example',
    selectors: {
      turnstile: false,
      hcaptcha: true,
      recaptcha: true,
      cloudflareInterstitial: false
    },
    siteKeys: {
      hcaptcha: 'h-sitekey',
      recaptcha: 'r-sitekey'
    }
  })

  assert.deepEqual(challenge, {
    family: 'hcaptcha',
    kind: 'captcha',
    siteKey: 'h-sitekey'
  })
})
