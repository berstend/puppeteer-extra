const path = require('path')
const real100 = require('./real100.corpus')
const sharedProbeScript = path.join(__dirname, '../probes/playwright-extra.js')

module.exports = {
  name: 'gs75-stealth-real100-clean',
  variants: [
    {
      id: 'baseline',
      label: 'original',
      workspacePath: '/home/rc/tmp/stealth-benchmark-run/baseline',
      probe: { script: sharedProbeScript }
    },
    {
      id: 'candidate',
      label: 'pr1',
      workspacePath: '/home/rc/tmp/stealth-benchmark-run/candidate',
      probe: { script: sharedProbeScript }
    }
  ],
  lanes: [
    {
      id: 'gs75-native',
      label: 'gs75-native',
      kind: 'native',
      browser: { headless: true }
    }
  ],
  profileModes: [
    {
      id: 'cold',
      label: 'Fresh ephemeral profile',
      strategy: 'fresh'
    }
  ],
  passes: [
    {
      id: 'observe',
      label: 'Observe only',
      solverMode: 'disabled'
    }
  ],
  repetitions: {
    default: 1,
    escalateTo: 1
  },
  artifacts: {
    rootDir: '../benchmark-output-real100-clean'
  },
  sites: real100
}
