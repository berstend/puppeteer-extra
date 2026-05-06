const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const {
  buildBrowserArgs,
  resolveTargetUrl,
  detectChallengeFromSnapshot,
  resolvePersistentUserDataDir,
  preparePersistentUserDataDir
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

test('resolvePersistentUserDataDir prefers explicit userDataDir and otherwise uses runDir seed clone', () => {
  assert.equal(
    resolvePersistentUserDataDir({
      profileMode: { browser: { userDataDir: '/tmp/explicit-profile' } },
      artifacts: { runDir: '/tmp/run-a' }
    }),
    '/tmp/explicit-profile'
  )

  assert.equal(
    resolvePersistentUserDataDir({
      profileMode: { browser: { seedUserDataDir: '/tmp/profile-seed' } },
      artifacts: { runDir: '/tmp/run-b' }
    }),
    path.join('/tmp/run-b', 'user-data-dir')
  )
})

test('preparePersistentUserDataDir clones the seed profile into a clean target directory', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-profile-'))
  const seedDir = path.join(root, 'seed')
  const targetDir = path.join(root, 'target')
  fs.mkdirSync(path.join(seedDir, 'Default'), { recursive: true })
  fs.writeFileSync(path.join(seedDir, 'Local State'), '{"profile":true}')
  fs.writeFileSync(path.join(seedDir, 'Default', 'Preferences'), '{"seed":true}')
  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(path.join(targetDir, 'stale.txt'), 'stale')

  await preparePersistentUserDataDir(targetDir, seedDir)

  assert.equal(fs.existsSync(path.join(targetDir, 'stale.txt')), false)
  assert.equal(fs.readFileSync(path.join(targetDir, 'Local State'), 'utf8'), '{"profile":true}')
  assert.equal(fs.readFileSync(path.join(targetDir, 'Default', 'Preferences'), 'utf8'), '{"seed":true}')
})
