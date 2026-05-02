#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { loadConfig } = require('./lib/config')
const { expandPairs } = require('./lib/matrix')
const { runMatrix } = require('./lib/runner')
const { readSummaryFromResults, renderSummaryMarkdown } = require('./lib/report')

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i]
    if (!value.startsWith('--')) {
      args._.push(value)
      continue
    }
    const key = value.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
      continue
    }
    args[key] = next
    i += 1
  }
  return args
}

function printUsage() {
  console.error(
    [
      'Usage:',
      '  node benchmark/cli.js plan --config <path>',
      '  node benchmark/cli.js run --config <path> [--dry-run] [--limit <n>]',
      '  node benchmark/cli.js report --results <summary.json|summary.md|results-dir>'
    ].join('\n')
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const command = args._[0]
  if (!command) {
    printUsage()
    process.exitCode = 1
    return
  }

  if (command === 'plan') {
    const configPath = args.config
    if (!configPath) {
      throw new Error('--config is required for plan')
    }
    const config = await loadConfig(configPath)
    const pairs = expandPairs(config)
    const output = {
      name: config.name,
      variants: config.variants.map(variant => variant.id),
      sites: config.sites.length,
      flows: config.sites.reduce((sum, site) => sum + site.flows.length, 0),
      lanes: config.lanes.length,
      profileModes: config.profileModes.length,
      passes: config.passes.length,
      pairs: pairs.length,
      runs: pairs.length * config.variants.length
    }
    process.stdout.write(JSON.stringify(output, null, 2) + '\n')
    return
  }

  if (command === 'run') {
    const configPath = args.config
    if (!configPath) {
      throw new Error('--config is required for run')
    }
    const config = await loadConfig(configPath)
    const result = await runMatrix(config, {
      dryRun: Boolean(args['dry-run']),
      limit: args.limit ? Number(args.limit) : null,
      pairPattern: args.pair ? String(args.pair) : null
    })
    process.stdout.write(JSON.stringify(result.summary, null, 2) + '\n')
    return
  }

  if (command === 'report') {
    const resultsPath = args.results
    if (!resultsPath) {
      throw new Error('--results is required for report')
    }
    const summary = readSummaryFromResults(resultsPath)
    const markdown = renderSummaryMarkdown(summary)
    process.stdout.write(markdown + '\n')
    return
  }

  printUsage()
  process.exitCode = 1
}

main().catch(error => {
  process.stderr.write((error && error.stack) || String(error))
  process.stderr.write('\n')
  process.exitCode = 1
})
