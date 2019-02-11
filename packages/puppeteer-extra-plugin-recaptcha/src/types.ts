import * as Puppeteer from 'puppeteer'

/**
 * Extend window object with recaptcha things
 */
declare global {
  interface Window {
    __google_recaptcha_client?: boolean
    ___grecaptcha_cfg?: {
      clients?: any
    }
  }
}

export type RecaptchaPluginPageAdditions = {
  findRecaptchas: () => Promise<FindRecaptchasResult>

  getRecaptchaSolutions: (
    captchas: CaptchaInfo[],
    provider?: SolutionProvider
  ) => Promise<GetSolutionsResult>

  enterRecaptchaSolutions: (
    solutions: CaptchaSolution[]
  ) => Promise<EnterRecaptchaSolutionsResult>

  solveRecaptchas: () => Promise<SolveRecaptchasResult>
}
export type Page = Puppeteer.Page & RecaptchaPluginPageAdditions

export interface SolutionProvider {
  id?: string
  token?: string
  fn?: (captchas: CaptchaInfo[], token?: string) => Promise<GetSolutionsResult>
}

export interface FindRecaptchasResult {
  captchas: CaptchaInfo[]
  error?: any
}
export interface EnterRecaptchaSolutionsResult {
  solved: CaptchaSolved[]
  error?: any
}
export interface GetSolutionsResult {
  solutions: CaptchaSolution[]
  error?: any
}

export type SolveRecaptchasResult = FindRecaptchasResult &
  EnterRecaptchaSolutionsResult &
  GetSolutionsResult

export interface CaptchaInfo {
  id?: string // captcha id
  widgetId?: number
  sitekey?: string
  callback?: string | Function
  hasResponseElement?: boolean
  url?: string
  display?: {
    size?: string
    theme?: string
    top?: string
    left?: string
    width?: string
    height?: string
  }
}

export interface CaptchaSolution {
  id?: string // captcha id
  provider?: string
  providerCaptchaId?: string
  text?: string // the solution
  requestAt?: Date
  responseAt?: Date
  duration?: number
  error?: string | Error
  hasSolution?: boolean
}

export interface CaptchaSolved {
  id?: string // captcha id
  responseElement?: boolean
  responseCallback?: boolean
  solvedAt?: Date
  error?: string | Error
  isSolved?: boolean
}

export interface PluginOptions {
  visualFeedback: boolean
  throwOnError: boolean
  provider?: SolutionProvider
}

export interface ContentScriptOpts {
  visualFeedback: boolean
}

export interface ContentScriptData {
  solutions?: CaptchaSolution[]
}
