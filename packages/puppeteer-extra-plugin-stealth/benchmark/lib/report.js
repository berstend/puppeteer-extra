'use strict'

const fs = require('fs')
const path = require('path')

function summarizePairResults(pairResults) {
  const summary = {
    generatedAt: new Date().toISOString(),
    totalPairs: pairResults.length,
    bySeverity: {},
    byOutcome: {},
    bySite: {}
  }

  for (const pair of pairResults) {
    increment(summary.bySeverity, pair.diff.severity)
    increment(summary.byOutcome, pair.baseline.outcome.id)
    increment(summary.byOutcome, pair.candidate.outcome.id)
    const siteSummary = summary.bySite[pair.site.id] || {
      tier: pair.site.tier,
      class: pair.site.class,
      pairs: 0,
      severities: {}
    }
    siteSummary.pairs += 1
    increment(siteSummary.severities, pair.diff.severity)
    summary.bySite[pair.site.id] = siteSummary
  }

  return summary
}

function renderSummaryMarkdown(summary) {
  const lines = []
  lines.push('# Stealth Benchmark Summary')
  lines.push('')
  lines.push(`- Generated: ${summary.generatedAt}`)
  lines.push(`- Total pairs: ${summary.totalPairs}`)
  lines.push('')
  lines.push('## Severity counts')
  lines.push('')
  for (const [severity, count] of Object.entries(summary.bySeverity)) {
    lines.push(`- ${severity}: ${count}`)
  }
  lines.push('')
  lines.push('## Sites')
  lines.push('')
  for (const [siteId, site] of Object.entries(summary.bySite)) {
    lines.push(`- ${siteId} (tier ${site.tier}, ${site.class}): ${site.pairs} pairs`)
  }
  return lines.join('\n')
}

function readSummaryFromResults(resultsPath) {
  const absolutePath = path.resolve(resultsPath)
  const stats = fs.statSync(absolutePath)
  if (stats.isDirectory()) {
    return JSON.parse(fs.readFileSync(path.join(absolutePath, 'summary.json'), 'utf8'))
  }
  if (absolutePath.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
  }
  throw new Error(`Unsupported results path: ${resultsPath}`)
}

function increment(object, key) {
  object[key] = (object[key] || 0) + 1
}

module.exports = {
  summarizePairResults,
  renderSummaryMarkdown,
  readSummaryFromResults
}
