const path = require('path')
const tier1 = require('./tier1.corpus')
const tier2 = require('./tier2.corpus')
const priority = require('./priority.corpus.example')
const sharedProbeScript = path.join(__dirname, '../probes/playwright-extra.js')

module.exports = {
  name: 'gs75-stealth-matrix',
  variants: [
    {
      id: 'baseline',
      label: 'original',
      workspacePath: '../../../../../../puppeteer-extra-original',
      probe: {
        script: sharedProbeScript
      }
    },
    {
      id: 'candidate',
      label: 'pr1',
      workspacePath: '../../../../../../puppeteer-extra-pr1',
      probe: {
        script: sharedProbeScript
      }
    }
  ],
  lanes: [
    {
      id: 'gs75-native',
      kind: 'native',
      browser: { headless: true, channel: 'chrome' }
    },
    {
      id: 'clash-verge-sticky',
      kind: 'proxy',
      proxyServer: 'socks5://127.0.0.1:7890',
      tags: ['clash', 'sticky'],
      browser: { headless: true, channel: 'chrome' }
    },
    {
      id: 'us-vps-ipv4',
      kind: 'native',
      network: { hostHint: '74.48.189.187', family: 'ipv4' },
      browser: { headless: true, channel: 'chrome' }
    },
    {
      id: 'us-vps-ipv6-he',
      kind: 'native',
      network: { hostHint: 'he-tunnel', family: 'ipv6' },
      browser: { headless: true, channel: 'chrome' }
    }
  ],
  profileModes: [
    {
      id: 'cold',
      label: 'Fresh ephemeral profile',
      strategy: 'fresh'
    },
    {
      id: 'warm',
      label: 'Warm Monika profile',
      strategy: 'persistent',
      browser: {
        userDataDir: '/home/rc/.config/stealth-benchmark/monika-profile'
      }
    }
  ],
  passes: [
    {
      id: 'observe',
      label: 'Observe only',
      solverMode: 'disabled'
    },
    {
      id: 'solver',
      label: '2Captcha recovery',
      solverMode: '2captcha',
      solver: {
        command: 'python3 /opt/benchmark/tools/two_captcha.py'
      }
    }
  ],
  repetitions: {
    default: 5,
    escalateTo: 10
  },
  artifacts: {
    rootDir: '../benchmark-output'
  },
  sites: [...tier1, ...tier2, ...priority]
}
