#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const { createRequire } = require('module')
const { buildSolveCommand } = require('../lib/solver')
const { spawn } = require('child_process')

async function main() {
  const inputFile = process.env.STEALTH_BENCH_INPUT_FILE || getArg('--input')
  if (!inputFile) {
    throw new Error('Missing --input or STEALTH_BENCH_INPUT_FILE')
  }
  const input = JSON.parse(await fs.promises.readFile(inputFile, 'utf8'))
  const requireFromWorkspace = createRequire(path.join(input.variant.workspacePath, 'package.json'))
  const { chromium } = requireFromWorkspace('playwright-extra')
  const stealthPlugin = requireFromWorkspace('puppeteer-extra-plugin-stealth')

  chromium.use(stealthPlugin())

  const browserArgs = buildBrowserArgs(input)
  const state = {
    console: { errors: [], warnings: [] },
    network: { failed: [] }
  }

  let browser = null
  let context = null
  let page = null
  let mainResponse = null
  try {
    if (input.profileMode.strategy === 'persistent') {
      const userDataDir = input.profileMode.browser.userDataDir || path.join(os.tmpdir(), 'stealth-benchmark', input.variant.id, input.pairId)
      context = await chromium.launchPersistentContext(userDataDir, browserArgs)
      page = context.pages()[0] || (await context.newPage())
    } else {
      browser = await chromium.launch(browserArgs)
      context = await browser.newContext()
      page = await context.newPage()
    }

    wireObservers(page, state)

    mainResponse = await page.goto(input.site.url, {
      waitUntil: 'domcontentloaded',
      timeout: input.flow.timeoutMs || 30000
    })

    await runFlow(page, input.flow)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

    const challenge = await detectChallenge(page)
    let solver = { attempted: false, solved: false, error: null }
    if (input.pass.solverMode === '2captcha' && challenge && input.pass.solver && input.pass.solver.command) {
      solver = await attemptSolve(page, input.site.url, input.pass.solver.command, challenge)
    }

    const success = await evaluateSuccess(page, input.flow)
    const degraded = success && Boolean(input.flow.degradeOnMissingSelectors && input.flow.degradeOnMissingSelectors.length)
      ? !(await selectorsExist(page, input.flow.degradeOnMissingSelectors))
      : false

    await captureArtifacts(page, input.artifacts)

    const result = {
      success,
      degraded,
      degradedReason: degraded ? 'missing-degraded-selectors' : null,
      statusCode: mainResponse ? mainResponse.status() : null,
      url: page.url(),
      title: await page.title(),
      challenge,
      solver,
      block: classifyBlock(mainResponse, challenge),
      console: state.console,
      network: state.network
    }
    await fs.promises.writeFile(input.artifacts.outputFile, JSON.stringify(result, null, 2))
  } catch (error) {
    const result = {
      success: false,
      runtimeError: error.message,
      stack: error.stack,
      timedOut: /Timeout/i.test(error.message)
    }
    await fs.promises.writeFile(input.artifacts.outputFile, JSON.stringify(result, null, 2))
  } finally {
    if (context) {
      await context.close().catch(() => {})
    }
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}

function buildBrowserArgs(input) {
  const browser = Object.assign({}, input.lane.browser, input.profileMode.browser)
  const args = {
    headless: browser.headless !== false
  }
  if (browser.channel) {
    args.channel = browser.channel
  }
  if (input.lane.proxyServer) {
    args.proxy = { server: input.lane.proxyServer }
  }
  return args
}

async function runFlow(page, flow) {
  const actions = Array.isArray(flow.actions) && flow.actions.length
    ? flow.actions
    : [{ type: 'wait', ms: 3000 }]

  for (const action of actions) {
    if (action.type === 'wait') {
      await page.waitForTimeout(action.ms || 1000)
    } else if (action.type === 'click') {
      await page.click(action.selector, { timeout: action.timeoutMs || 10000 })
    } else if (action.type === 'type') {
      await page.fill(action.selector, action.text || '')
    } else if (action.type === 'press') {
      await page.press(action.selector, action.key)
    } else if (action.type === 'waitForSelector') {
      await page.waitForSelector(action.selector, { timeout: action.timeoutMs || 10000 })
    }
  }
}

function wireObservers(page, state) {
  page.on('console', message => {
    if (message.type() === 'error') {
      state.console.errors.push(message.text())
    } else if (message.type() === 'warning') {
      state.console.warnings.push(message.text())
    }
  })
  page.on('requestfailed', request => {
    state.network.failed.push({
      url: request.url(),
      failure: request.failure()
    })
  })
}

async function detectChallenge(page) {
  return page.evaluate(() => {
    const text = document.body ? document.body.innerText : ''
    const title = document.title || ''
    const checks = [
      {
        family: 'turnstile',
        kind: 'captcha',
        selector: 'iframe[src*="challenges.cloudflare.com"], .cf-turnstile, [name="cf-turnstile-response"]',
        siteKeySelector: '.cf-turnstile[data-sitekey], [data-sitekey]'
      },
      {
        family: 'recaptcha',
        kind: 'captcha',
        selector: 'iframe[src*="recaptcha"], [name="g-recaptcha-response"]',
        siteKeySelector: '[data-sitekey]'
      },
      {
        family: 'hcaptcha',
        kind: 'captcha',
        selector: 'iframe[src*="hcaptcha"], [name="h-captcha-response"], [data-hcaptcha-widget-id]',
        siteKeySelector: '[data-sitekey]'
      },
      {
        family: 'cloudflare_interstitial',
        kind: 'challenge',
        selector: 'body',
        textMatch: ['Just a moment', 'Checking your browser before accessing', 'Verify you are human']
      }
    ]

    for (const check of checks) {
      const matchedSelector = check.selector && document.querySelector(check.selector)
      const matchedText = Array.isArray(check.textMatch) && check.textMatch.some(sample => text.includes(sample) || title.includes(sample))
      if (matchedSelector || matchedText) {
        const siteKeyElement = check.siteKeySelector ? document.querySelector(check.siteKeySelector) : null
        return {
          family: check.family,
          kind: check.kind,
          siteKey: siteKeyElement ? siteKeyElement.getAttribute('data-sitekey') : null
        }
      }
    }
    return null
  })
}

async function attemptSolve(page, websiteUrl, command, challenge) {
  try {
    const solveCommand = buildSolveCommand({ command, websiteUrl, challenge })
    const stdoutChunks = []
    const stderrChunks = []
    const output = await new Promise((resolve, reject) => {
      const child = spawn(solveCommand.command, solveCommand.args, {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      child.stdout.on('data', chunk => stdoutChunks.push(chunk))
      child.stderr.on('data', chunk => stderrChunks.push(chunk))
      child.on('error', reject)
      child.on('close', code => {
        if (code !== 0) {
          reject(new Error(Buffer.concat(stderrChunks).toString('utf8') || `solver exited with ${code}`))
          return
        }
        resolve(Buffer.concat(stdoutChunks).toString('utf8'))
      })
    })
    const token = extractToken(output)
    if (!token) {
      return { attempted: true, solved: false, error: 'solver produced no token' }
    }
    await injectToken(page, challenge, token)
    return { attempted: true, solved: true, error: null }
  } catch (error) {
    return { attempted: true, solved: false, error: error.message }
  }
}

function extractToken(output) {
  try {
    const parsed = JSON.parse(output)
    if (parsed && parsed.solution && typeof parsed.solution.token === 'string') {
      return parsed.solution.token
    }
    if (parsed && parsed.token) {
      return parsed.token
    }
  } catch (_) {}
  const trimmed = output.trim()
  return trimmed || null
}

async function injectToken(page, challenge, token) {
  await page.evaluate(
    ({ family, token }) => {
      const fieldMap = {
        turnstile: ['textarea[name="cf-turnstile-response"]', 'input[name="cf-turnstile-response"]'],
        recaptcha: ['textarea[name="g-recaptcha-response"]', 'input[name="g-recaptcha-response"]'],
        hcaptcha: ['textarea[name="h-captcha-response"]', 'input[name="h-captcha-response"]']
      }
      const selectors = fieldMap[family] || []
      for (const selector of selectors) {
        const element = document.querySelector(selector)
        if (!element) continue
        element.value = token
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
    },
    { family: challenge.family, token }
  )
}

async function evaluateSuccess(page, flow) {
  if (flow.success && flow.success.selector) {
    return Boolean(await page.$(flow.success.selector))
  }
  if (flow.success && flow.success.text) {
    const text = await page.textContent('body')
    return text.includes(flow.success.text)
  }
  if (flow.success && flow.success.urlIncludes) {
    return page.url().includes(flow.success.urlIncludes)
  }
  return true
}

async function selectorsExist(page, selectors) {
  for (const selector of selectors) {
    if (!(await page.$(selector))) {
      return false
    }
  }
  return true
}

async function captureArtifacts(page, artifacts) {
  await page.screenshot({ path: artifacts.screenshotFile, fullPage: true }).catch(() => {})
  const html = await page.content().catch(() => null)
  if (html) {
    await fs.promises.writeFile(artifacts.htmlFile, html)
  }
}

function classifyBlock(response, challenge) {
  const status = response ? response.status() : null
  if (status === 403 || status === 429) {
    return { level: 'hard', reason: `status-${status}` }
  }
  if (challenge && challenge.kind === 'challenge') {
    return { level: 'soft', reason: challenge.family }
  }
  return null
}

function getArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write((error && error.stack) || String(error))
    process.stderr.write('\n')
    process.exitCode = 1
  })
}

module.exports = {
  buildBrowserArgs
}
