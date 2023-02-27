import * as types from './types'

export const ContentScriptDefaultOpts: types.ContentScriptOpts = {
  visualFeedback: true
}

export const ContentScriptDefaultData: types.ContentScriptData = {
  solutions: []
}

/**
 * Content script for Hcaptcha handling (runs in browser context)
 * @note External modules are not supported here (due to content script isolation)
 */
export class HcaptchaContentScript {
  private opts: types.ContentScriptOpts
  private data: types.ContentScriptData

  private baseUrls = [
    'assets.hcaptcha.com/captcha/v1/',
    'newassets.hcaptcha.com/captcha/v1/',
  ]

  constructor(
    opts = ContentScriptDefaultOpts,
    data = ContentScriptDefaultData
  ) {
    // Workaround for https://github.com/esbuild-kit/tsx/issues/113
    if (typeof globalThis.__name === 'undefined') {
      globalThis.__defProp = Object.defineProperty
      globalThis.__name = (target, value) =>
        globalThis.__defProp(target, 'name', { value, configurable: true })
    }

    this.opts = opts
    this.data = data
  }

  private async _waitUntilDocumentReady() {
    return new Promise(function(resolve) {
      if (!document || !window) return resolve(null)
      const loadedAlready = /^loaded|^i|^c/.test(document.readyState)
      if (loadedAlready) return resolve(null)

      function onReady() {
        resolve(null)
        document.removeEventListener('DOMContentLoaded', onReady)
        window.removeEventListener('load', onReady)
      }

      document.addEventListener('DOMContentLoaded', onReady)
      window.addEventListener('load', onReady)
    })
  }

  private _paintCaptchaBusy($iframe: HTMLIFrameElement) {
    try {
      if (this.opts.visualFeedback) {
        $iframe.style.filter = `opacity(60%) hue-rotate(400deg)` // violet
      }
    } catch (error) {
      // noop
    }
    return $iframe
  }

  /** Regular checkboxes */
  private _findRegularCheckboxes() {
    const nodeList = document.querySelectorAll<HTMLIFrameElement>(
      this.baseUrls.map(url => `iframe[src*='${url}'][data-hcaptcha-widget-id]:not([src*='invisible'])`).join(',')
    )
    return Array.from(nodeList)
  }

  /** Find active challenges from invisible hcaptchas */
  private _findActiveChallenges() {
    const nodeList = document.querySelectorAll<HTMLIFrameElement>(
      this.baseUrls.map(url => `div[style*='visible'] iframe[src*='${url}'][src*='hcaptcha.html']`).join(',')
    )
    return Array.from(nodeList)
  }

  private _extractInfoFromIframes(iframes: HTMLIFrameElement[]) {
    return iframes
      .map(el => el.src.replace('.html#', '.html?'))
      .map(url => {
        const { searchParams } = new URL(url)
        const result: types.CaptchaInfo = {
          _vendor: 'hcaptcha',
          url: document.location.href,
          id: searchParams.get('id'),
          sitekey: searchParams.get('sitekey'),
          display: {
            size: searchParams.get('size') || 'normal'
          }
        }
        return result
      })
  }

  public async findRecaptchas() {
    const result = {
      captchas: [] as types.CaptchaInfo[],
      error: null as null | Error
    }
    try {
      await this._waitUntilDocumentReady()
      const iframes = [
        ...this._findRegularCheckboxes(),
        ...this._findActiveChallenges()
      ]
      if (!iframes.length) {
        return result
      }
      result.captchas = this._extractInfoFromIframes(iframes)
      iframes.forEach(el => {
        this._paintCaptchaBusy(el)
      })
    } catch (error) {
      result.error = error
      return result
    }
    return result
  }

  public async enterRecaptchaSolutions() {
    const result = {
      solved: [] as types.CaptchaSolved[],
      error: null as any
    }
    try {
      await this._waitUntilDocumentReady()

      const solutions = this.data.solutions
      if (!solutions || !solutions.length) {
        result.error = 'No solutions provided'
        return result
      }
      result.solved = solutions
        .filter(solution => solution._vendor === 'hcaptcha')
        .filter(solution => solution.hasSolution === true)
        .map(solution => {
          window.postMessage(
            JSON.stringify({
              id: solution.id,
              label: 'challenge-closed',
              source: 'hcaptcha',
              contents: {
                event: 'challenge-passed',
                expiration: 120,
                response: solution.text
              }
            }),
            '*'
          )
          return {
            _vendor: solution._vendor,
            id: solution.id,
            isSolved: true,
            solvedAt: new Date()
          }
        })
    } catch (error) {
      result.error = error
      return result
    }
    return result
  }
}
