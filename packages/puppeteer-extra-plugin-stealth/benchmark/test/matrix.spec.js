const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeConfig } = require('../lib/config')
const { expandPairs } = require('../lib/matrix')

function buildConfig() {
  return normalizeConfig(
    {
      variants: [
        { id: 'baseline', workspacePath: './baseline', probe: { script: 'probe.js' } },
        { id: 'candidate', workspacePath: './candidate', probe: { script: 'probe.js' } }
      ],
      lanes: [{ id: 'native' }, { id: 'proxy' }],
      profileModes: [{ id: 'cold' }, { id: 'warm', strategy: 'persistent' }],
      passes: [{ id: 'observe' }, { id: 'solver', solverMode: '2captcha' }],
      repetitions: { default: 3, escalateTo: 10 },
      sites: [
        {
          id: 'site-a',
          url: 'https://example.com',
          flows: [
            { id: 'landing', type: 'landing' },
            { id: 'search', type: 'search' }
          ]
        }
      ]
    },
    '/tmp/project',
    '/tmp/project/config.js'
  )
}

test('expandPairs creates a strict pair matrix', () => {
  const pairs = expandPairs(buildConfig())
  assert.equal(pairs.length, 48)
  assert.equal(pairs[0].variants.length, 2)
  assert.equal(pairs[0].pairId, 'site-a__landing__native__cold__observe__r1')
})
