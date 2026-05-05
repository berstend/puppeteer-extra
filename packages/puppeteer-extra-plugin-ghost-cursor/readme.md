# puppeteer-extra-plugin-ghost-cursor

> A [`puppeteer-extra`](https://github.com/berstend/puppeteer-extra) / [`playwright-extra`](https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra) plugin for human-like mouse and keyboard interactions.

On **Puppeteer** it wraps [`ghost-cursor`](https://github.com/Xetera/ghost-cursor) for mouse movement.
On **Playwright** it uses a built-in Bezier curve implementation via `page.mouse`.
The platform is auto-detected per page at runtime — no configuration needed.

## Install

```bash
# Puppeteer
npm install puppeteer-extra-plugin-ghost-cursor ghost-cursor

# Playwright (ghost-cursor not required)
npm install puppeteer-extra-plugin-ghost-cursor
```

## Usage

```js
// Puppeteer
const puppeteer = require('puppeteer-extra')
const GhostCursorPlugin = require('puppeteer-extra-plugin-ghost-cursor')

puppeteer.use(GhostCursorPlugin())

const page = await (await puppeteer.launch({ headless: false })).newPage()
await page.goto('https://example.com')

await page.humanClick('button#submit')           // curved move + click
await page.humanType('input#search', 'hello')    // click field + human typing
await page.humanMove(500, 300)                   // curved move, no click
await page.ghostCursor.moveTo({ x: 200, y: 400 }) // raw cursor access
```

```js
// Playwright — identical API, no ghost-cursor dep needed
const { chromium } = require('playwright-extra')
const GhostCursorPlugin = require('puppeteer-extra-plugin-ghost-cursor')

chromium.use(GhostCursorPlugin())

const page = await (await chromium.launch()).newPage()
await page.humanClick('button#submit')
await page.humanType('input#email', 'user@example.com', { wpm: 120 })
// page.ghostCursor is null on Playwright
```

## Features

### Cursor position memory

The last known cursor position is stored per page. Every `humanMove` and
`humanClick` call starts from the correct location rather than `(0, 0)`,
producing coherent paths across multiple interactions.

### Automatic scroll-to-element

If `boundingBox()` returns `null` because the target is off-screen, the plugin
calls `scrollIntoView({ block: 'center' })` and retries automatically before
raising an error.

### Variable click position

Clicks land at a random point within the central 60% of the element bounding
box. Humans do not click the exact pixel centre every time.

### Ease-in/ease-out speed curve

Mouse steps are timed with a sine curve so the cursor accelerates at the
start of a move and decelerates near the target, matching natural hand motion.
Total travel time has ±20% random variance.

### Human-like typing (`humanType`)

Keystroke delays vary per character. Pauses are longer after punctuation and
spaces, and a 7% random "hesitation" pause is inserted to simulate thinking.
Speed is configurable via `opts.wpm` (default: 180 wpm).

### Autonomous debug mode

Enable `debug: true` to get automatic failure recovery:

```js
puppeteer.use(GhostCursorPlugin({ debug: true, debugDir: 'my-debug' }))
```

When `humanClick` fails the plugin:

1. Saves a full-page JPEG screenshot to `debugDir`.
2. Logs the selector, page URL and error.
3. Retries once with a direct `page.click()` / `locator.click()` fallback.
4. Re-throws the original error only if the fallback also fails.

```
[ghost-cursor] humanClick failed on "button#submit" @ https://example.com
  Error   : Element has no boundingBox — hidden or detached
  Snapshot: my-debug/2025-01-15T10-30-00Z_button_submit.jpg
[ghost-cursor] Fallback click succeeded for "button#submit".
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `moveDelay` | `number` | `0` | Extra ms between move end and click |
| `debug` | `boolean` | `false` | Autonomous debug mode |
| `debugDir` | `string` | `'ghost-cursor-debug'` | Screenshot output directory |

## API

### `page.humanClick(selectorOrHandle)`

Moves to the target element via a Bezier-curved path with ease-in/ease-out
timing, then fires a native mouse click at a random point within the central
60% of the element. Scrolls the element into view if needed.

Accepts a CSS selector string, `ElementHandle` (Puppeteer), or `Locator`
(Playwright).

### `page.humanMove(x, y)`

Moves to the given coordinates via a Bezier path. Updates cursor position
memory so the next move starts from here.

### `page.humanType(selector, text [, opts])`

Clicks the target field, then types each character with randomised inter-key
delays. `opts.wpm` controls approximate speed (default: `180`).

### `page.ghostCursor`

The underlying `GhostCursor` instance (Puppeteer only). `null` on Playwright.

## License

MIT
