// Extend Playwright interfaces transparently to the end user.
import {} from 'playwright-core'

import { RecaptchaPluginPageAdditions } from './types'

declare module 'playwright-core' {
  interface Page extends RecaptchaPluginPageAdditions {}
  interface Frame extends RecaptchaPluginPageAdditions {}
}
