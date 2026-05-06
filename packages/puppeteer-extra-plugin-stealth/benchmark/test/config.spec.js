const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { normalizeConfig } = require('../lib/config')

test('normalizeConfig applies defaults and resolves paths', () => {
  const config = normalizeConfig(
    {
      variants: [
        { id: 'baseline', workspacePath: './baseline', probe: { script: 'probe.js' } },
        { id: 'candidate', workspacePath: './candidate', probe: { script: 'probe.js' } }
      ],
      lanes: [{ id: 'native' }],
      sites: [{ id: 'site', url: 'https://example.com', flows: [{ id: 'landing', type: 'landing' }] }]
    },
    '/tmp/project',
    '/tmp/project/config.js'
  )

  assert.equal(config.profileModes.length, 1)
  assert.equal(config.passes.length, 1)
  assert.equal(config.repetitions.default, 5)
  assert.equal(config.variants[0].workspacePath, path.resolve('/tmp/project', './baseline'))
  assert.equal(config.artifacts.rootDir, path.resolve('/tmp/project', 'benchmark-output'))
})

test('normalizeConfig rejects configs without exactly two variants', () => {
  assert.throws(() => {
    normalizeConfig(
      {
        variants: [{ id: 'baseline', workspacePath: './baseline', probe: { script: 'probe.js' } }],
        lanes: [{ id: 'native' }],
        sites: [{ id: 'site', url: 'https://example.com', flows: [{ id: 'landing', type: 'landing' }] }]
      },
      '/tmp/project',
      '/tmp/project/config.js'
    )
  }, /exactly 2 variants/)
})
