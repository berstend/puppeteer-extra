const test = require('node:test')
const assert = require('node:assert/strict')
const { classifyProbeResult, diffPair } = require('../lib/outcome')

test('classifyProbeResult maps challenge and success states', () => {
  assert.equal(classifyProbeResult({ success: true }).id, 'clean_success')
  assert.equal(classifyProbeResult({ success: true, degraded: true }).id, 'degraded_success')
  assert.equal(classifyProbeResult({ challenge: { family: 'turnstile', kind: 'captcha' } }).id, 'captcha_required')
  assert.equal(classifyProbeResult({ block: { level: 'hard', reason: 'status-403' } }).id, 'hard_block')
})

test('classifyProbeResult treats timed out probes as timeout even when they include runtime errors', () => {
  const outcome = classifyProbeResult({
    success: false,
    runtimeError: 'page.goto: Timeout 30000ms exceeded.',
    timedOut: true
  })

  assert.equal(outcome.id, 'timeout')
  assert.equal(outcome.score, 10)
})

test('diffPair marks directional severity', () => {
  const baseline = classifyProbeResult({ challenge: { family: 'turnstile', kind: 'captcha' } })
  const candidate = classifyProbeResult({ success: true })
  const diff = diffPair(baseline, candidate)
  assert.equal(diff.severity, 'major_improvement')
  assert.equal(diff.scoreDelta, 45)
})

test('classifyProbeResult records surface quality score for successful modern UA-CH snapshots', () => {
  const baseline = classifyProbeResult({
    success: true,
    surface: {
      platform: 'Win32',
      uaData: {
        brands: [
          { brand: 'Chromium', version: '104' },
          { brand: ' Not A;Brand', version: '99' },
          { brand: 'Google Chrome', version: '104' }
        ],
        fullVersionList: [],
        bitness: '',
        mobile: false,
        platform: 'Windows',
        platformVersion: '10.0',
        uaFullVersion: '104.0.5112.48'
      }
    }
  })
  const candidate = classifyProbeResult({
    success: true,
    surface: {
      platform: 'Win32',
      uaData: {
        brands: [
          { brand: 'Chromium', version: '104' },
          { brand: 'Google Chrome', version: '104' },
          { brand: 'Not/A)Brand', version: '99' }
        ],
        fullVersionList: [
          { brand: 'Chromium', version: '104.0.5112.48' },
          { brand: 'Google Chrome', version: '104.0.5112.48' },
          { brand: 'Not/A)Brand', version: '99.0.0.0' }
        ],
        bitness: '64',
        mobile: false,
        platform: 'Windows',
        platformVersion: '10.0',
        uaFullVersion: '104.0.5112.48'
      }
    }
  })

  assert.ok((candidate.meta.surfaceScore || 0) > (baseline.meta.surfaceScore || 0))

  const diff = diffPair(baseline, candidate)
  assert.equal(diff.scoreDelta, 0)
  assert.ok(diff.surfaceScoreDelta > 0)
  assert.equal(diff.severity, 'moderate_improvement')
})
