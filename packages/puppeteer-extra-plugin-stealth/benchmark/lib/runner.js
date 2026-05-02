'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')
const { expandPairs } = require('./matrix')
const { classifyProbeResult, diffPair } = require('./outcome')
const { summarizePairResults, renderSummaryMarkdown } = require('./report')

async function runMatrix(config, options = {}) {
  const pairs = filterPairs(expandPairs(config), options)
  await fs.promises.mkdir(config.artifacts.rootDir, { recursive: true })
  const pairResults = []
  for (const pair of pairs) {
    const result = await runPair(config, pair, options)
    pairResults.push(result)
  }
  const summary = summarizePairResults(pairResults)
  await writeAggregateArtifacts(config.artifacts.rootDir, pairResults, summary)
  return { pairs: pairResults, summary }
}

async function runPair(config, pair, options = {}) {
  const pairDir = path.join(config.artifacts.rootDir, 'pairs', pair.pairId)
  await fs.promises.mkdir(pairDir, { recursive: true })
  const runResults = {}
  for (const variant of config.variants) {
    const runSpec = createRunSpec(pairDir, pair, variant)
    await fs.promises.mkdir(runSpec.runDir, { recursive: true })
    await fs.promises.writeFile(runSpec.inputFile, JSON.stringify(runSpec.payload, null, 2))
    const rawResult = options.dryRun
      ? createDryRunResult(runSpec)
      : await spawnProbe(runSpec, variant, pair)
    const outcome = classifyProbeResult(rawResult)
    const normalized = {
      runId: runSpec.runId,
      pairId: runSpec.pairId,
      variantId: variant.id,
      rawResult,
      outcome
    }
    await fs.promises.writeFile(runSpec.normalizedResultFile, JSON.stringify(normalized, null, 2))
    runResults[variant.id] = normalized
  }

  const baseline = runResults[config.variants[0].id]
  const candidate = runResults[config.variants[1].id]
  return {
    pairId: pair.pairId,
    site: { id: pair.site.id, tier: pair.site.tier, class: pair.site.class },
    flow: { id: pair.flow.id, type: pair.flow.type },
    lane: { id: pair.lane.id },
    profileMode: { id: pair.profileMode.id },
    pass: { id: pair.pass.id },
    baseline,
    candidate,
    diff: diffPair(baseline.outcome, candidate.outcome)
  }
}

function filterPairs(pairs, options) {
  const limit = options.limit || null
  const pairPattern = options.pairPattern ? new RegExp(options.pairPattern) : null
  const filtered = pairPattern ? pairs.filter(pair => pairPattern.test(pair.pairId)) : pairs
  return typeof limit === 'number' && Number.isFinite(limit) ? filtered.slice(0, limit) : filtered
}

function createRunSpec(pairDir, pair, variant) {
  const runDir = path.join(pairDir, variant.id)
  const inputFile = path.join(runDir, 'input.json')
  const outputFile = path.join(runDir, 'result.raw.json')
  const normalizedResultFile = path.join(runDir, 'result.normalized.json')
  const stdoutFile = path.join(runDir, 'stdout.log')
  const stderrFile = path.join(runDir, 'stderr.log')
  const screenshotFile = path.join(runDir, 'screenshot.png')
  const htmlFile = path.join(runDir, 'page.html')
  return {
    pairId: pair.pairId,
    runId: `${pair.pairId}__${variant.id}`,
    runDir,
    inputFile,
    outputFile,
    normalizedResultFile,
    stdoutFile,
    stderrFile,
    screenshotFile,
    htmlFile,
    payload: {
      pairId: pair.pairId,
      runId: `${pair.pairId}__${variant.id}`,
      variant: {
        id: variant.id,
        label: variant.label,
        workspacePath: variant.workspacePath
      },
      lane: pair.lane,
      profileMode: pair.profileMode,
      pass: pair.pass,
      site: pair.site,
      flow: pair.flow,
      artifacts: {
        runDir,
        outputFile,
        screenshotFile,
        htmlFile
      }
    }
  }
}

function createDryRunResult(runSpec) {
  return {
    success: false,
    runtimeError: null,
    dryRun: true,
    failureReason: `dry-run:${runSpec.runId}`
  }
}

async function spawnProbe(runSpec, variant, pair) {
  const invocation = resolveInvocation(runSpec, variant)
  const stdout = fs.createWriteStream(runSpec.stdoutFile)
  const stderr = fs.createWriteStream(runSpec.stderrFile)

  await new Promise((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: variant.workspacePath,
      env: Object.assign({}, process.env, variant.env, pair.lane.env, invocation.env),
      stdio: ['ignore', 'pipe', 'pipe']
    })

    child.stdout.pipe(stdout)
    child.stderr.pipe(stderr)

    child.on('error', reject)
    child.on('close', code => {
      stdout.end()
      stderr.end()
      if (code !== 0) {
        reject(new Error(`Probe ${runSpec.runId} exited with code ${code}`))
        return
      }
      resolve()
    })
  })

  return JSON.parse(await fs.promises.readFile(runSpec.outputFile, 'utf8'))
}

function resolveInvocation(runSpec, variant) {
  if (variant.probe.command) {
    return {
      command: '/bin/sh',
      args: ['-lc', variant.probe.command],
      env: {
        STEALTH_BENCH_INPUT_FILE: runSpec.inputFile
      }
    }
  }

  return {
    command: process.execPath,
    args: [path.resolve(variant.workspacePath, variant.probe.script), '--input', runSpec.inputFile],
    env: {}
  }
}

async function writeAggregateArtifacts(rootDir, pairResults, summary) {
  const resultsFile = path.join(rootDir, 'pair-results.jsonl')
  const summaryJsonFile = path.join(rootDir, 'summary.json')
  const summaryMarkdownFile = path.join(rootDir, 'summary.md')
  const jsonl = pairResults.map(result => JSON.stringify(result)).join('\n') + (pairResults.length ? '\n' : '')
  await fs.promises.writeFile(resultsFile, jsonl)
  await fs.promises.writeFile(summaryJsonFile, JSON.stringify(summary, null, 2))
  await fs.promises.writeFile(summaryMarkdownFile, renderSummaryMarkdown(summary) + '\n')
}

module.exports = {
  runMatrix,
  runPair,
  createRunSpec
}
