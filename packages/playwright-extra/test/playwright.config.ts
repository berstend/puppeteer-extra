import { type PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  retries: 3,
  workers: 3,

  use: {
    browserName: 'chromium',
    launchOptions: {
      chromiumSandbox: process.env.CI ? false : true,
      args: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : []
    }
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium'
      }
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox'
      }
    },
    {
      name: 'webkit',
      use: {
        browserName: 'webkit'
      }
    }
  ]
}

export default config
