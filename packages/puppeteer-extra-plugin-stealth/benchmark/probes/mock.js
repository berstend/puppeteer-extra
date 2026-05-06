#!/usr/bin/env node
'use strict'

const fs = require('fs')

async function main() {
  const inputFile = process.env.STEALTH_BENCH_INPUT_FILE || getArg('--input')
  if (!inputFile) {
    throw new Error('Missing --input or STEALTH_BENCH_INPUT_FILE')
  }
  const input = JSON.parse(await fs.promises.readFile(inputFile, 'utf8'))
  const scenario = (input.flow.mockByVariant && input.flow.mockByVariant[input.variant.id]) || {}
  const result = Object.assign(
    {
      success: false,
      degraded: false,
      statusCode: 200,
      challenge: null,
      block: null,
      runtimeError: null
    },
    scenario
  )
  await fs.promises.writeFile(input.artifacts.outputFile, JSON.stringify(result, null, 2))
  process.stdout.write(`mock probe wrote ${input.artifacts.outputFile}\n`)
}

function getArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

main().catch(error => {
  process.stderr.write((error && error.stack) || String(error))
  process.stderr.write('\n')
  process.exitCode = 1
})
