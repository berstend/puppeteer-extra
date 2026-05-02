const test = require('node:test')
const assert = require('node:assert/strict')
const { classifyProbeResult, diffPair } = require('../lib/outcome')

test('classifyProbeResult maps challenge and success states', () => {
  assert.equal(classifyProbeResult({ success: true }).id, 'clean_success')
  assert.equal(classifyProbeResult({ success: true, degraded: true }).id, 'degraded_success')
  assert.equal(classifyProbeResult({ challenge: { family: 'turnstile', kind: 'captcha' } }).id, 'captcha_required')
  assert.equal(classifyProbeResult({ block: { level: 'hard', reason: 'status-403' } }).id, 'hard_block')
})

test('diffPair marks directional severity', () => {
  const baseline = classifyProbeResult({ challenge: { family: 'turnstile', kind: 'captcha' } })
  const candidate = classifyProbeResult({ success: true })
  const diff = diffPair(baseline, candidate)
  assert.equal(diff.severity, 'major_improvement')
  assert.equal(diff.scoreDelta, 45)
})
