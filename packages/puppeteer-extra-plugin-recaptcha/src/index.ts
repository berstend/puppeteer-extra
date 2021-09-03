import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

import { Browser, Frame, Page } from 'puppeteer'

import * as types from './types'

import { RecaptchaContentScript } from './content'
import { HcaptchaContentScript } from './content-hcaptcha'
import * as TwoCaptcha from './provider/2captcha'

export const BuiltinSolutionProviders: types.SolutionProvider[] = [
  {
    id: TwoCaptcha.PROVIDER_ID,
    fn: TwoCaptcha.getSolutions
  }
]

/**
 * A puppeteer-extra plugin to automatically detect and solve reCAPTCHAs.
 * @noInheritDoc
 */
export class PuppeteerExtraPluginRecaptcha extends PuppeteerExtraPlugin {
  public opts: types.PluginOptions
  private contentScriptDebug: debug.Debugger

  constructor(opts: Partial<types.PluginOptions>) {
    super(opts)
    this.debug('Initialized', this.opts)

    this.contentScriptDebug = this.debug.extend('cs')
  }

  get name() {
    return 'recaptcha'
  }

  get defaults(): types.PluginOptions {
    return {
      visualFeedback: true,
      throwOnError: false,
      solveInViewportOnly: false,
      solveScoreBased: false,
      solveInactiveChallenges: false
    }
  }

  get contentScriptOpts(): types.ContentScriptOpts {
    const { visualFeedback } = this.opts
    return {
      visualFeedback,
      debugBinding: this.contentScriptDebug.enabled
        ? this.debugBindingName
        : undefined
    }
  }

  /** An optional global window object we use for contentscript debug logging */
  private debugBindingName = '___pepr_cs'

  private _generateContentScript(
    vendor: types.CaptchaVendor,
    fn: 'findRecaptchas' | 'enterRecaptchaSolutions',
    data?: any
  ) {
    this.debug('_generateContentScript', vendor, fn, data)
    let scriptSource = RecaptchaContentScript.toString()
    let scriptName = 'RecaptchaContentScript'
    if (vendor === 'hcaptcha') {
      scriptSource = HcaptchaContentScript.toString()
      scriptName = 'HcaptchaContentScript'
    }
    return `(async() => {
      const DATA = ${JSON.stringify(data || null)}
      const OPTS = ${JSON.stringify(this.contentScriptOpts)}

      ${scriptSource}
      const script = new ${scriptName}(OPTS, DATA)
      return script.${fn}()
    })()`
  }

  /** Based on the user defined options we may want to filter out certain captchas (inactive, etc) */
  private _filterRecaptchas(recaptchas: types.CaptchaInfo[] = []) {
    const results = recaptchas.map((c: types.FilteredCaptcha) => {
      if (
        c._type === 'invisible' &&
        !c.hasActiveChallengePopup &&
        !this.opts.solveInactiveChallenges
      ) {
        c.filtered = true
        c.filteredReason = 'solveInactiveChallenges'
      }
      if (c._type === 'score' && !this.opts.solveScoreBased) {
        c.filtered = true
        c.filteredReason = 'solveScoreBased'
      }
      if (
        c._type === 'checkbox' &&
        !c.isInViewport &&
        this.opts.solveInViewportOnly
      ) {
        c.filtered = true
        c.filteredReason = 'solveInViewportOnly'
      }
      if (c.filtered) {
        this.debug('Filtered out captcha based on provided options', {
          id: c.id,
          reason: c.filteredReason,
          captcha: c
        })
      }
      return c
    })
    return {
      captchas: results.filter(c => !c.filtered) as types.CaptchaInfo[],
      filtered: results.filter(c => c.filtered)
    }
  }

  async findRecaptchas(page: Page | Frame) {
    this.debug('findRecaptchas')
    // As this might be called very early while recaptcha is still loading
    // we add some extra waiting logic for developer convenience.
    const hasRecaptchaScriptTag = await page.$(
      `script[src*="/recaptcha/api.js"], script[src*="/recaptcha/enterprise.js"]`
    )
    this.debug('hasRecaptchaScriptTag', !!hasRecaptchaScriptTag)
    if (hasRecaptchaScriptTag) {
      this.debug('waitForRecaptchaClient - start', new Date())
      await page
        .waitForFunction(
          `
        (function() {
          return Object.keys((window.___grecaptcha_cfg || {}).clients || {}).length
        })()
      `,
          { polling: 200, timeout: 10 * 1000 }
        )
        .catch(this.debug)
      this.debug('waitForRecaptchaClient - end', new Date()) // used as timer
    }
    const hasHcaptchaScriptTag = await page.$(
      `script[src*="//hcaptcha.com/1/api.js"]`
    )
    this.debug('hasHcaptchaScriptTag', !!hasHcaptchaScriptTag)
    if (hasHcaptchaScriptTag) {
      this.debug('wait:hasHcaptchaScriptTag - start', new Date())
      await page.waitForFunction(
        `
        (function() {
          return window.hcaptcha
        })()
      `,
        { polling: 200, timeout: 10 * 1000 }
      )
      this.debug('wait:hasHcaptchaScriptTag - end', new Date()) // used as timer
    }

    const onDebugBindingCalled = (message: string, data: any) => {
      this.contentScriptDebug(message, data)
    }

    if (this.contentScriptDebug.enabled) {
      if ('exposeFunction' in page) {
        await page.exposeFunction(this.debugBindingName, onDebugBindingCalled)
      }
    }
    // Even without a recaptcha script tag we're trying, just in case.
    const resultRecaptcha: types.FindRecaptchasResult = (await page.evaluate(
      this._generateContentScript('recaptcha', 'findRecaptchas')
    )) as any
    const resultHcaptcha: types.FindRecaptchasResult = (await page.evaluate(
      this._generateContentScript('hcaptcha', 'findRecaptchas')
    )) as any

    const filterResults = this._filterRecaptchas(resultRecaptcha.captchas)
    this.debug(
      `Filter results: ${filterResults.filtered.length} of ${filterResults.captchas.length} captchas filtered from results.`
    )

    const response: types.FindRecaptchasResult = {
      captchas: [...filterResults.captchas, ...resultHcaptcha.captchas],
      filtered: filterResults.filtered,
      error: resultRecaptcha.error || resultHcaptcha.error
    }
    this.debug('findRecaptchas', response)
    if (this.opts.throwOnError && response.error) {
      throw new Error(response.error)
    }
    return response
  }

  async getRecaptchaSolutions(
    captchas: types.CaptchaInfo[],
    provider?: types.SolutionProvider
  ) {
    this.debug('getRecaptchaSolutions', { captchaNum: captchas.length })
    provider = provider || this.opts.provider
    if (
      !provider ||
      (!provider.token && !provider.fn) ||
      (provider.token && provider.token === 'XXXXXXX' && !provider.fn)
    ) {
      throw new Error('Please provide a solution provider to the plugin.')
    }
    let fn = provider.fn
    if (!fn) {
      const builtinProvider = BuiltinSolutionProviders.find(
        p => p.id === (provider || {}).id
      )
      if (!builtinProvider || !builtinProvider.fn) {
        throw new Error(
          `Cannot find builtin provider with id '${provider.id}'.`
        )
      }
      fn = builtinProvider.fn
    }
    const response = await fn.call(
      this,
      captchas,
      provider.token,
      provider.opts || {}
    )
    response.error =
      response.error ||
      response.solutions.find((s: types.CaptchaSolution) => !!s.error)
    this.debug('getRecaptchaSolutions', response)
    if (response && response.error) {
      console.warn(
        'PuppeteerExtraPluginRecaptcha: An error occured during "getRecaptchaSolutions":',
        response.error
      )
    }
    if (this.opts.throwOnError && response.error) {
      throw new Error(response.error)
    }
    return response
  }

  async enterRecaptchaSolutions(
    page: Page | Frame,
    solutions: types.CaptchaSolution[]
  ) {
    this.debug('enterRecaptchaSolutions', { solutions })

    const hasRecaptcha = !!solutions.find(s => s._vendor === 'recaptcha')
    const solvedRecaptcha: types.EnterRecaptchaSolutionsResult = hasRecaptcha
      ? ((await page.evaluate(
          this._generateContentScript('recaptcha', 'enterRecaptchaSolutions', {
            solutions
          })
        )) as any)
      : { solved: [] }
    const hasHcaptcha = !!solutions.find(s => s._vendor === 'hcaptcha')
    const solvedHcaptcha: types.EnterRecaptchaSolutionsResult = hasHcaptcha
      ? ((await page.evaluate(
          this._generateContentScript('hcaptcha', 'enterRecaptchaSolutions', {
            solutions
          })
        )) as any)
      : { solved: [] }

    const response: types.EnterRecaptchaSolutionsResult = {
      solved: [...solvedRecaptcha.solved, ...solvedHcaptcha.solved],
      error: solvedRecaptcha.error || solvedHcaptcha.error
    }
    response.error = response.error || response.solved.find(s => !!s.error)
    this.debug('enterRecaptchaSolutions', response)
    if (this.opts.throwOnError && response.error) {
      throw new Error(response.error)
    }
    return response
  }

  async solveRecaptchas(
    page: Page | Frame
  ): Promise<types.SolveRecaptchasResult> {
    this.debug('solveRecaptchas')
    const response: types.SolveRecaptchasResult = {
      captchas: [],
      filtered: [],
      solutions: [],
      solved: [],
      error: null
    }
    try {
      // If `this.opts.throwOnError` is set any of the
      // following will throw and abort execution.
      const {
        captchas,
        filtered,
        error: captchasError
      } = await this.findRecaptchas(page)
      response.captchas = captchas
      response.filtered = filtered

      if (captchas.length) {
        const {
          solutions,
          error: solutionsError
        } = await this.getRecaptchaSolutions(response.captchas)
        response.solutions = solutions

        const {
          solved,
          error: solvedError
        } = await this.enterRecaptchaSolutions(page, response.solutions)
        response.solved = solved

        response.error = captchasError || solutionsError || solvedError
      }
    } catch (error) {
      response.error = error.toString()
    }
    this.debug('solveRecaptchas', response)
    if (this.opts.throwOnError && response.error) {
      throw new Error(response.error)
    }
    return response
  }

  private _addCustomMethods(prop: Page | Frame) {
    prop.findRecaptchas = async () => this.findRecaptchas(prop)
    prop.getRecaptchaSolutions = async (
      captchas: types.CaptchaInfo[],
      provider?: types.SolutionProvider
    ) => this.getRecaptchaSolutions(captchas, provider)
    prop.enterRecaptchaSolutions = async (solutions: types.CaptchaSolution[]) =>
      this.enterRecaptchaSolutions(prop, solutions)
    // Add convenience methods that wraps all others
    prop.solveRecaptchas = async () => this.solveRecaptchas(prop)
  }

  async onPageCreated(page: Page) {
    this.debug('onPageCreated', page.url())
    // Make sure we can run our content script
    await page.setBypassCSP(true)

    // Add custom page methods
    this._addCustomMethods(page)

    // Add custom methods to potential frames as well
    page.on('frameattached', frame => {
      if (!frame) return
      this._addCustomMethods(frame)
    })
  }

  /** Add additions to already existing pages and frames */
  async onBrowser(browser: Browser) {
    const pages = await browser.pages()
    for (const page of pages) {
      this._addCustomMethods(page)
      for (const frame of page.mainFrame().childFrames()) {
        this._addCustomMethods(frame)
      }
    }
  }
}

/** Default export, PuppeteerExtraPluginRecaptcha  */
const defaultExport = (options?: Partial<types.PluginOptions>) => {
  return new PuppeteerExtraPluginRecaptcha(options || {})
}

export default defaultExport
