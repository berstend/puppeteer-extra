'use strict'

const OUTCOME_SCORES = {
  clean_success: 100,
  degraded_success: 80,
  captcha_required: 55,
  challenge_required: 50,
  soft_block: 35,
  hard_block: 15,
  timeout: 10,
  skipped: 0,
  runtime_error: 0
}

function classifyProbeResult(result) {
  if (!result || typeof result !== 'object') {
    return normalizeOutcome('runtime_error', { reason: 'missing-result' })
  }
  if (result.skipped || result.dryRun) {
    return normalizeOutcome('skipped', { reason: result.reason || 'dry-run' })
  }
  if (result.timedOut) {
    return normalizeOutcome('timeout', { reason: result.timeoutReason || 'timeout' })
  }
  if (result.runtimeError) {
    return normalizeOutcome('runtime_error', { reason: result.runtimeError })
  }
  if (result.block && result.block.level === 'hard') {
    return normalizeOutcome('hard_block', { reason: result.block.reason || 'hard-block' })
  }
  if (result.block && result.block.level === 'soft') {
    return normalizeOutcome('soft_block', { reason: result.block.reason || 'soft-block' })
  }
  if (result.challenge && result.challenge.family) {
    const outcomeId = result.challenge.kind === 'captcha' ? 'captcha_required' : 'challenge_required'
    return normalizeOutcome(outcomeId, { reason: result.challenge.family })
  }
  if (result.success && result.degraded) {
    return normalizeOutcome('degraded_success', { reason: result.degradedReason || 'degraded' })
  }
  if (result.success) {
    return normalizeOutcome('clean_success', { reason: 'success' })
  }
  if (result.statusCode === 403 || result.statusCode === 429) {
    return normalizeOutcome('hard_block', { reason: `status-${result.statusCode}` })
  }
  return normalizeOutcome('runtime_error', { reason: result.failureReason || 'unknown' })
}

function normalizeOutcome(id, meta = {}) {
  return {
    id,
    score: OUTCOME_SCORES[id],
    meta
  }
}

function diffPair(baselineOutcome, candidateOutcome) {
  const delta = candidateOutcome.score - baselineOutcome.score
  return {
    baseline: baselineOutcome.id,
    candidate: candidateOutcome.id,
    scoreDelta: delta,
    severity: classifySeverity(delta)
  }
}

function classifySeverity(delta) {
  if (delta >= 40) return 'major_improvement'
  if (delta >= 20) return 'moderate_improvement'
  if (delta >= 1) return 'minor_improvement'
  if (delta <= -40) return 'major_regression'
  if (delta <= -20) return 'moderate_regression'
  if (delta <= -1) return 'minor_regression'
  return 'no_material_change'
}

module.exports = {
  OUTCOME_SCORES,
  classifyProbeResult,
  diffPair
}
