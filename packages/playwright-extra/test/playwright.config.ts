import { type PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  retries: 3,
  workers: 3,

  use: {
    browserName: 'chromium'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          chromiumSandbox: process.env.CI ? false : true,
          args: process.env.CI
            ? ['--no-sandbox', '--disable-setuid-sandbox']
            : []
        }
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
        // Note: webkit doesn't support --no-sandbox
      }
    }
  ]
}

export default config
