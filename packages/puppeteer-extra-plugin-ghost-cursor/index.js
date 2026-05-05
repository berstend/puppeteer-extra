'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const fs = require('fs')
const path = require('path')

// ---------------------------------------------------------------------------
// Bezier + motion helpers
// ---------------------------------------------------------------------------

/**
 * Generate N points along a cubic Bezier curve between two coordinates.
 * Control points are randomised to produce natural-looking paths.
 * @private
 */
function bezierPoints (x0, y0, x1, y1, steps) {
  const dx = x1 - x0
  const dy = y1 - y0
  const cp1x = x0 + dx * (0.2 + Math.random() * 0.3)
  const cp1y = y0 + (Math.random() - 0.5) * Math.abs(dy) * 1.2
  const cp2x = x0 + dx * (0.6 + Math.random() * 0.3)
  const cp2y = y1 + (Math.random() - 0.5) * Math.abs(dy) * 1.2
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    pts.push({
      x: mt ** 3 * x0 + 3 * mt ** 2 * t * cp1x + 3 * mt * t ** 2 * cp2x + t ** 3 * x1,
      y: mt ** 3 * y0 + 3 * mt ** 2 * t * cp1y + 3 * mt * t ** 2 * cp2y + t ** 3 * y1
    })
  }
  return pts
}

/**
 * Compute per-step delays for a path of `steps` points that ease-in and ease-out.
 * Total travel time is sampled around `baseMs` ms.
 * @private
 */
function motionDelays (steps, baseMs) {
  const total = baseMs * (0.8 + Math.random() * 0.4) // ±20% natural variance
  const delays = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    // sine ease-in-out: slow at start and end, fast in the middle
    const weight = Math.sin(t * Math.PI)
    delays.push(weight)
  }
  const sum = delays.reduce((a, b) => a + b, 0)
  return delays.map(w => Math.round((w / sum) * total))
}

/**
 * Move the mouse along a Bezier path with ease-in/ease-out timing.
 * @private
 */
async function moveBezier (mouse, x0, y0, x1, y1, opts = {}) {
  const steps = opts.steps || 22
  const baseMs = opts.baseMs || 180
  const pts = bezierPoints(x0, y0, x1, y1, steps)
  const delays = motionDelays(steps, baseMs)
  for (let i = 0; i < pts.length; i++) {
    await mouse.move(pts[i].x, pts[i].y)
    if (delays[i] > 0) await sleep(delays[i])
  }
}

/** Random integer in [min, max] */
function rand (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep (ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

/** Returns true when `page` is a Playwright Page. */
function isPlaywright (page) {
  return typeof page.locator === 'function'
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * A `puppeteer-extra` / `playwright-extra` plugin that provides human-like
 * mouse and keyboard interactions powered by Bezier curves and realistic timing.
 *
 * ### Platform support
 * - **Puppeteer** — wraps [`ghost-cursor`](https://github.com/Xetera/ghost-cursor) (peer dep).
 * - **Playwright** — built-in Bezier implementation, no extra dependency.
 * - Platform is auto-detected per page at runtime.
 *
 * ### Helpers added to every page
 *
 * | Method | Description |
 * |--------|-------------|
 * | `page.humanClick(selectorOrHandle)` | Curved move → native click |
 * | `page.humanMove(x, y)` | Curved move, no click |
 * | `page.humanType(selector, text)` | Click field + type with human delays |
 * | `page.ghostCursor` | Raw GhostCursor (Puppeteer only) |
 *
 * ### Behaviour details
 *
 * - **Cursor position memory** — the last known cursor position is stored per
 *   page so every move starts from the correct location rather than `(0, 0)`.
 * - **Scroll-to-element** — if `boundingBox()` returns `null` (element
 *   off-screen), the plugin scrolls it into view and retries automatically.
 * - **Variable click position** — clicks land at a random point within the
 *   central 60% of the element bounding box, not always at the exact centre.
 * - **Ease-in/ease-out speed** — move steps are timed with a sine curve so
 *   the cursor accelerates at the start and decelerates near the target.
 * - **Autonomous debug mode** — on failure, saves a screenshot, logs context,
 *   and retries once with a direct click fallback.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.moveDelay=0]       Extra ms after move, before click.
 * @param {boolean} [opts.debug=false]       Enable autonomous debug mode.
 * @param {string}  [opts.debugDir='ghost-cursor-debug'] Debug screenshot dir.
 *
 * @example
 * // Puppeteer
 * const puppeteer = require('puppeteer-extra')
 * const GhostCursorPlugin = require('puppeteer-extra-plugin-ghost-cursor')
 * puppeteer.use(GhostCursorPlugin({ debug: true }))
 *
 * const page = await (await puppeteer.launch()).newPage()
 * await page.goto('https://example.com')
 * await page.humanClick('button#submit')
 * await page.humanType('input#search', 'hello world')
 *
 * @example
 * // Playwright
 * const { chromium } = require('playwright-extra')
 * const GhostCursorPlugin = require('puppeteer-extra-plugin-ghost-cursor')
 * chromium.use(GhostCursorPlugin())
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = {}) {
    super(opts)
  }

  get name () { return 'ghost-cursor' }

  get defaults () {
    return { moveDelay: 0, debug: false, debugDir: 'ghost-cursor-debug' }
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  _ensureDebugDir () {
    if (!fs.existsSync(this.opts.debugDir)) {
      fs.mkdirSync(this.opts.debugDir, { recursive: true })
    }
  }

  /**
   * Autonomous debug handler: screenshot + log + direct-click retry.
   * @returns {Promise<boolean>} true if fallback succeeded
   */
  async _debugAndRetry (page, selector, err, handle) {
    this._ensureDebugDir()
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const slug = String(selector).replace(/[^\w-]/g, '_').slice(0, 40)
    const screenshotPath = path.join(this.opts.debugDir, `${ts}_${slug}.jpg`)
    try {
      await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 70, fullPage: true })
    } catch (_) {}
    console.warn(
      `[ghost-cursor] humanClick failed on "${selector}" @ ${page.url()}\n` +
      `  Error   : ${err.message}\n` +
      `  Snapshot: ${screenshotPath}`
    )
    try {
      if (isPlaywright(page)) {
        await page.locator(selector).click({ timeout: 5000 })
      } else if (handle) {
        await handle.click()
      } else {
        await page.click(selector, { timeout: 5000 })
      }
      console.warn(`[ghost-cursor] Fallback click succeeded for "${selector}".`)
      return true
    } catch (retryErr) {
      console.warn(`[ghost-cursor] Fallback click also failed: ${retryErr.message}`)
      return false
    }
  }

  /**
   * Resolve a bounding box, scrolling the element into view and retrying
   * once if the first attempt returns null (element off-screen).
   * @private
   */
  async _boundingBoxWithScroll (page, handle, locator) {
    // First attempt
    const box = handle
      ? await handle.boundingBox()
      : await locator.boundingBox({ timeout: 5000 })
    if (box) return box

    // Element is likely off-screen — scroll into view and retry
    if (handle) {
      await handle.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    } else {
      await locator.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    }
    await sleep(600)

    const box2 = handle
      ? await handle.boundingBox()
      : await locator.boundingBox({ timeout: 5000 })
    return box2 // may still be null — caller decides what to do
  }

  /**
   * Pick a random click point within the central 60% of a bounding box.
   * Humans do not click the exact pixel centre every time.
   * @private
   */
  _randomClickPoint (box) {
    const margin = 0.2 // 20% margin on each side → central 60%
    return {
      x: box.x + box.width  * (margin + Math.random() * (1 - 2 * margin)),
      y: box.y + box.height * (margin + Math.random() * (1 - 2 * margin))
    }
  }

  // -------------------------------------------------------------------------
  // Puppeteer path — ghost-cursor for moves, custom logic for the rest
  // -------------------------------------------------------------------------

  async _setupPuppeteer (page) {
    let createCursor
    try {
      createCursor = require('ghost-cursor').createCursor
    } catch (_) {
      throw new Error(
        "puppeteer-extra-plugin-ghost-cursor: peer dependency 'ghost-cursor' not found.\n" +
        'Please install it: npm install ghost-cursor'
      )
    }

    const cursor = createCursor(page)
    page.ghostCursor = cursor

    // Cursor position memory — updated after every move or click
    const pos = { x: 0, y: 0 }
    const self = this

    /**
     * Move to (x, y) via ghost-cursor and update position memory.
     */
    page.humanMove = async (x, y) => {
      await cursor.moveTo({ x, y })
      pos.x = x; pos.y = y
    }

    /**
     * Click a target element with a human-like curved approach.
     * Resolves coordinates via `boundingBox()`, scrolls into view if needed,
     * and clicks at a random point within the central 60% of the element.
     *
     * @param {string|import('puppeteer').ElementHandle} selectorOrHandle
     */
    page.humanClick = async (selectorOrHandle) => {
      const isPureHandle = typeof selectorOrHandle !== 'string'
      const selector = isPureHandle ? '[ElementHandle]' : selectorOrHandle
      const handle = isPureHandle ? selectorOrHandle : await page.$(selectorOrHandle)

      const run = async () => {
        if (!handle) throw new Error(`Element not found for selector "${selector}"`)
        const box = await self._boundingBoxWithScroll(page, handle, null)
        if (!box) throw new Error(`Element has no boundingBox — hidden or detached`)
        const { x, y } = self._randomClickPoint(box)
        await cursor.moveTo({ x, y })
        pos.x = x; pos.y = y
        if (self.opts.moveDelay > 0) await sleep(self.opts.moveDelay)
        await page.mouse.click(x, y)
      }

      if (!self.opts.debug) return run()
      try {
        return await run()
      } catch (err) {
        const ok = await self._debugAndRetry(page, selector, err, handle)
        if (!ok) throw err
      }
    }

    /**
     * Click an input or textarea, then type `text` with human-like key timing.
     * Delays vary per character: faster on common letters, slower after
     * punctuation and spaces, with occasional short pauses simulating thought.
     *
     * @param {string} selector  CSS selector for the input field
     * @param {string} text      Text to type
     * @param {object} [opts]
     * @param {number} [opts.wpm=180]  Approximate words per minute (±30%)
     */
    page.humanType = async (selector, text, opts = {}) => {
      await page.humanClick(selector)
      await sleep(rand(80, 200))
      const wpm = opts.wpm || 180
      const msPerChar = Math.round(60000 / (wpm * 5))
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        await page.keyboard.type(ch)
        // Longer pause after punctuation and spaces (simulates thinking)
        const isPunctuation = /[.,;:!?\s]/.test(ch)
        const delay = isPunctuation
          ? rand(msPerChar * 2, msPerChar * 5)
          : rand(Math.round(msPerChar * 0.6), Math.round(msPerChar * 1.6))
        // Occasional micro-pause (1 in 15 chars) simulating hesitation
        const extraPause = Math.random() < 0.07 ? rand(150, 400) : 0
        await sleep(delay + extraPause)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Playwright path — built-in Bezier curves
  // -------------------------------------------------------------------------

  async _setupPlaywright (page) {
    page.ghostCursor = null

    // Cursor position memory
    const pos = { x: 0, y: 0 }
    const self = this

    /**
     * Move to (x, y) via Bezier curve with ease-in/ease-out timing.
     */
    page.humanMove = async (x, y) => {
      await moveBezier(page.mouse, pos.x, pos.y, x, y)
      pos.x = x; pos.y = y
    }

    /**
     * Move to the element centre via a Bezier path, then click.
     * Scrolls into view if needed; clicks at a random point within the element.
     *
     * @param {string|import('playwright').Locator} selectorOrLocator
     */
    page.humanClick = async (selectorOrLocator) => {
      const isLocator = selectorOrLocator && typeof selectorOrLocator.boundingBox === 'function'
      const selector = isLocator ? '[Locator]' : selectorOrLocator
      const locator = isLocator ? selectorOrLocator : page.locator(selector)

      const run = async () => {
        const box = await self._boundingBoxWithScroll(page, null, locator)
        if (!box) throw new Error(`Element has no boundingBox — hidden or detached`)
        const { x, y } = self._randomClickPoint(box)
        await moveBezier(page.mouse, pos.x, pos.y, x, y)
        pos.x = x; pos.y = y
        if (self.opts.moveDelay > 0) await sleep(self.opts.moveDelay)
        await page.mouse.click(x, y)
      }

      if (!self.opts.debug) return run()
      try {
        return await run()
      } catch (err) {
        const ok = await self._debugAndRetry(page, selector, err)
        if (!ok) throw err
      }
    }

    /**
     * Click an input field, then type with human-like key delays.
     *
     * @param {string} selector  CSS selector for the input
     * @param {string} text
     * @param {object} [opts]
     * @param {number} [opts.wpm=180]
     */
    page.humanType = async (selector, text, opts = {}) => {
      await page.humanClick(selector)
      await sleep(rand(80, 200))
      const wpm = opts.wpm || 180
      const msPerChar = Math.round(60000 / (wpm * 5))
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        await page.keyboard.type(ch)
        const isPunctuation = /[.,;:!?\s]/.test(ch)
        const delay = isPunctuation
          ? rand(msPerChar * 2, msPerChar * 5)
          : rand(Math.round(msPerChar * 0.6), Math.round(msPerChar * 1.6))
        const extraPause = Math.random() < 0.07 ? rand(150, 400) : 0
        await sleep(delay + extraPause)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async onPageCreated (page) {
    if (isPlaywright(page)) {
      await this._setupPlaywright(page)
    } else {
      await this._setupPuppeteer(page)
    }
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
