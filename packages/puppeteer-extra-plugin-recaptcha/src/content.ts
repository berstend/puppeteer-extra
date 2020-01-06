import * as types from './types'

export const ContentScriptDefaultOpts: types.ContentScriptOpts = {
  visualFeedback: true
}

export const ContentScriptDefaultData: types.ContentScriptData = {
  solutions: []
}

/**
 * Content script for Recaptcha handling (runs in browser context)
 * @note External modules are not supported here (due to content script isolation)
 */
export class RecaptchaContentScript {
  private opts: types.ContentScriptOpts
  private data: types.ContentScriptData

  constructor(
    opts = ContentScriptDefaultOpts,
    data = ContentScriptDefaultData
  ) {
    this.opts = opts
    this.data = data
  }

  // Poor mans _.pluck
  private _pick = (props: any[]) => (o: any) =>
    props.reduce((a, e) => ({ ...a, [e]: o[e] }), {})

  // Recaptcha client is a nested, circular object with object keys that seem generated
  // We flatten that object a couple of levels deep for easy access to certain keys we're interested in.
  private _flattenObject(item: any, levels = 2, ignoreHTML = true) {
    const isObject = (x: any) => x && typeof x === 'object'
    const isHTML = (x: any) => x && x instanceof HTMLElement
    let newObj = {} as any
    for (let i = 0; i < levels; i++) {
      item = Object.keys(newObj).length ? newObj : item
      Object.keys(item).forEach(key => {
        if (ignoreHTML && isHTML(item[key])) return
        if (isObject(item[key])) {
          Object.keys(item[key]).forEach(innerKey => {
            if (ignoreHTML && isHTML(item[key][innerKey])) return
            const keyName = isObject(item[key][innerKey])
              ? `obj_${key}_${innerKey}`
              : `${innerKey}`
            newObj[keyName] = item[key][innerKey]
          })
        } else {
          newObj[key] = item[key]
        }
      })
    }
    return newObj
  }

  // Helper function to return an object based on a well known value
  private _getKeyByValue(object: any, value: any) {
    return Object.keys(object).find(key => object[key] === value)
  }

  private async _waitUntilDocumentReady() {
    return new Promise(function(resolve) {
      if (!document || !window) return resolve()
      const loadedAlready = /^loaded|^i|^c/.test(document.readyState)
      if (loadedAlready) return resolve()

      function onReady() {
        resolve()
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

  private _paintCaptchaSolved($iframe: HTMLIFrameElement) {
    try {
      if (this.opts.visualFeedback) {
        $iframe.style.filter = `opacity(60%) hue-rotate(230deg)` // green
      }
    } catch (error) {
      // noop
    }
    return $iframe
  }

  private _findVisibleIframeNodes() {
    return Array.from(
      document.querySelectorAll<HTMLIFrameElement>(
        `iframe[src^='https://www.google.com/recaptcha/api2/anchor'][name^="a-"]`
      )
    )
  }
  private _findVisibleIframeNodeById(id?: string) {
    return document.querySelector<HTMLIFrameElement>(
      `iframe[src^='https://www.google.com/recaptcha/api2/anchor'][name^="a-${id ||
        ''}"]`
    )
  }

  private getClients() {
    // Bail out early if there's no indication of recaptchas
    if (!window || !window.__google_recaptcha_client) return
    if (!window.___grecaptcha_cfg || !window.___grecaptcha_cfg.clients) {
      return
    }
    if (!Object.keys(window.___grecaptcha_cfg.clients).length) return
    return window.___grecaptcha_cfg.clients
  }

  private getVisibleIframesIds() {
    // Find all visible recaptcha boxes through their iframes
    return this._findVisibleIframeNodes()
      .filter($f => !$f.src.includes('invisible'))
      .map($f => this._paintCaptchaBusy($f))
      .filter($f => $f && $f.getAttribute('name'))
      .map($f => $f.getAttribute('name') || '') // a-841543e13666
      .map(
        rawId => rawId.split('-').slice(-1)[0] // a-841543e13666 => 841543e13666
      )
      .filter(id => id)
  }

  private getResponseInputById(id?: string) {
    if (!id) return
    const $iframe = this._findVisibleIframeNodeById(id)
    if (!$iframe) return
    const $parentForm = $iframe.closest(`form`)
    if ($parentForm) {
      return $parentForm.querySelector(`[name='g-recaptcha-response']`)
    }
    // Not all reCAPTCHAs are in forms
    // https://github.com/berstend/puppeteer-extra/issues/57
    if (document && document.body) {
      return document.body.querySelector(`[name='g-recaptcha-response']`)
    }
  }

  private getClientById(id?: string) {
    if (!id) return
    const clients = this.getClients()
    // Lookup captcha "client" info using extracted id
    let client: any = Object.values(clients || {})
      .filter(obj => this._getKeyByValue(obj, id))
      .shift() // returns first entry in array or undefined
    if (!client) return
    client = this._flattenObject(client) as any
    client.widgetId = client.id
    client.id = id
    return client
  }

  private extractInfoFromClient(client?: any) {
    if (!client) return
    const info: types.CaptchaInfo = this._pick(['sitekey', 'callback'])(client)
    if (!info.sitekey) return
    info.id = client.id
    info.widgetId = client.widgetId
    info.display = this._pick([
      'size',
      'top',
      'left',
      'width',
      'height',
      'theme'
    ])(client)
    // callbacks can be strings or funtion refs
    if (info.callback && typeof info.callback === 'function') {
      info.callback = info.callback.name || 'anonymous'
    }
    if (document && document.location) info.url = document.location.href
    return info
  }

  public async findRecaptchas() {
    const result = {
      captchas: [] as (types.CaptchaInfo | undefined)[],
      error: null as any
    }
    try {
      await this._waitUntilDocumentReady()
      const clients = this.getClients()
      if (!clients) return result
      result.captchas = this.getVisibleIframesIds()
        .map(id => this.getClientById(id))
        .map(client => this.extractInfoFromClient(client))
        .map(info => {
          if (!info) return
          const $input = this.getResponseInputById(info.id)
          info.hasResponseElement = !!$input
          return info
        })
        .filter(info => info)
    } catch (error) {
      result.error = error
      return result
    }
    return result
  }

  public async enterRecaptchaSolutions() {
    const result = {
      solved: [] as (types.CaptchaSolved | undefined)[],
      error: null as any
    }
    try {
      await this._waitUntilDocumentReady()
      const clients = this.getClients()
      if (!clients) {
        result.error = 'No recaptchas found'
        return result
      }
      const solutions = this.data.solutions
      if (!solutions || !solutions.length) {
        result.error = 'No solutions provided'
        return result
      }

      result.solved = this.getVisibleIframesIds()
        .map(id => this.getClientById(id))
        .map(client => {
          const solved: types.CaptchaSolved = {
            id: client.id,
            responseElement: false,
            responseCallback: false
          }
          const $iframe = this._findVisibleIframeNodeById(solved.id)
          if (!$iframe) {
            solved.error = `Iframe not found for id '${solved.id}'`
            return solved
          }
          const solution = solutions.find(s => s.id === solved.id)
          if (!solution || !solution.text) {
            solved.error = `Solution not found for id '${solved.id}'`
            return solved
          }
          // Enter solution in response textarea
          const $input = this.getResponseInputById(solved.id)
          if ($input) {
            $input.innerHTML = solution.text
            solved.responseElement = true
          }
          // Enter solution in optional callback
          if (client.callback) {
            try {
              if (typeof client.callback === 'function') {
                client.callback.call(window, solution.text)
              } else {
                eval(client.callback).call(window, solution.text) // tslint:disable-line
              }
              solved.responseCallback = true
            } catch (error) {
              solved.error = error
            }
          }
          // Finishing up
          solved.isSolved = solved.responseCallback || solved.responseElement
          solved.solvedAt = new Date()
          this._paintCaptchaSolved($iframe)
          return solved
        })
    } catch (error) {
      result.error = error
      return result
    }
    return result
  }
}

/*
// Example data

{
    "captchas": [{
        "sitekey": "6LdAUwoUAAAAAH44X453L0tUWOvx11XXXXXXXX",
        "id": "lnfy52r0cccc",
        "widgetId": 0,
        "display": {
            "size": null,
            "top": 23,
            "left": 13,
            "width": 28,
            "height": 28,
            "theme": null
        },
        "url": "https://example.com",
        "hasResponseElement": true
    }],
    "error": null
}

{
    "solutions": [{
        "id": "lnfy52r0cccc",
        "provider": "2captcha",
        "providerCaptchaId": "61109548000",
        "text": "03AF6jDqVSOVODT-wLKZ47U0UXz...",
        "requestAt": "2019-02-09T18:30:43.587Z",
        "responseAt": "2019-02-09T18:30:57.937Z"
    }]
    "error": null
}

{
    "solved": [{
        "id": "lnfy52r0cccc",
        "responseElement": true,
        "responseCallback": false,
        "isSolved": true,
        "solvedAt": {}
    }]
    "error": null
}
*/
