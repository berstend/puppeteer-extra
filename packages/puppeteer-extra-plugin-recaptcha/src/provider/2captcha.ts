export const PROVIDER_ID = '2captcha'
import * as types from '../types'

import Debug from 'debug'
const debug = Debug(`puppeteer-extra-plugin:recaptcha:${PROVIDER_ID}`)

// const solver = require('./2captcha-api')
import * as solver from './2captcha-api'

const secondsBetweenDates = (before: Date, after: Date) =>
  (after.getTime() - before.getTime()) / 1000

export interface DecodeRecaptchaAsyncResult {
  err?: any
  result?: any
  invalid?: any
}

async function decodeRecaptchaAsync(
  token: string,
  vendor: types.CaptchaVendor,
  sitekey: string,
  url: string,
  extraData: any,
  opts = { pollingInterval: 2000 }
): Promise<DecodeRecaptchaAsyncResult> {
  return new Promise((resolve) => {
    const cb = (err: any, result: any, invalid: any) =>
      resolve({ err, result, invalid })
    try {
      solver.setApiKey(token)

      let method = 'userrecaptcha'
      if (vendor === 'hcaptcha') {
        method = 'hcaptcha'
      }
      solver.decodeReCaptcha(method, sitekey, url, extraData, opts, cb)
    } catch (error) {
      return resolve({ err: error })
    }
  })
}

export async function getSolutions(
  captchas: types.CaptchaInfo[] = [],
  token?: string
): Promise<types.GetSolutionsResult> {
  const solutions = await Promise.all(
    captchas.map((c) => getSolution(c, token || ''))
  )
  return { solutions, error: solutions.find((s) => !!s.error) }
}

async function getSolution(
  captcha: types.CaptchaInfo,
  token: string
): Promise<types.CaptchaSolution> {
  const solution: types.CaptchaSolution = {
    _vendor: captcha._vendor,
    provider: PROVIDER_ID,
  }
  try {
    if (!captcha || !captcha.sitekey || !captcha.url || !captcha.id) {
      throw new Error('Missing data in captcha')
    }
    solution.id = captcha.id
    solution.requestAt = new Date()
    debug('Requesting solution..', solution)
    const extraData = {}
    if (captcha.s) {
      extraData['data-s'] = captcha.s // google site specific property
    }
    const { err, result, invalid } = await decodeRecaptchaAsync(
      token,
      captcha._vendor,
      captcha.sitekey,
      captcha.url,
      extraData
    )
    debug('Got response', { err, result, invalid })
    if (err) throw new Error(`${PROVIDER_ID} error: ${err}`)
    if (!result || !result.text || !result.id) {
      throw new Error(`${PROVIDER_ID} error: Missing response data: ${result}`)
    }
    solution.providerCaptchaId = result.id
    solution.text = result.text
    solution.responseAt = new Date()
    solution.hasSolution = !!solution.text
    solution.duration = secondsBetweenDates(
      solution.requestAt,
      solution.responseAt
    )
  } catch (error) {
    debug('Error', error)
    solution.error = error.toString()
  }
  return solution
}
