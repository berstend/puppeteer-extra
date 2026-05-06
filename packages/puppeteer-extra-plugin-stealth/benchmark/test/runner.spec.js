const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { normalizeConfig } = require('../lib/config')
const { runMatrix, orderVariantsForPair } = require('../lib/runner')

function createWorkspace(root, name) {
  const workspace = path.join(root, name)
  fs.mkdirSync(workspace, { recursive: true })
  return workspace
}

test('runMatrix executes paired mock probes and writes aggregate artifacts', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-bench-'))
  const baselineWorkspace = createWorkspace(tempRoot, 'baseline')
  const candidateWorkspace = createWorkspace(tempRoot, 'candidate')
  const probeScript = path.resolve(__dirname, '../probes/mock.js')
  const artifactsRoot = path.join(tempRoot, 'artifacts')

  const config = normalizeConfig(
    {
      variants: [
        { id: 'baseline', workspacePath: baselineWorkspace, probe: { script: probeScript } },
        { id: 'candidate', workspacePath: candidateWorkspace, probe: { script: probeScript } }
      ],
      lanes: [{ id: 'native' }],
      passes: [{ id: 'observe' }],
      profileModes: [{ id: 'cold' }],
      repetitions: { default: 1, escalateTo: 10 },
      artifacts: { rootDir: artifactsRoot },
      sites: [
        {
          id: 'site-a',
          url: 'https://example.com',
          flows: [
            {
              id: 'landing',
              type: 'landing',
              mockByVariant: {
                baseline: { challenge: { family: 'turnstile', kind: 'captcha' } },
                candidate: { success: true }
              }
            }
          ]
        }
      ]
    },
    tempRoot,
    path.join(tempRoot, 'config.js')
  )

  const result = await runMatrix(config)
  assert.equal(result.pairs.length, 1)
  assert.equal(result.pairs[0].diff.severity, 'major_improvement')
  assert.equal(fs.existsSync(path.join(artifactsRoot, 'summary.json')), true)
  assert.equal(fs.existsSync(path.join(artifactsRoot, 'pair-results.jsonl')), true)
})

test('orderVariantsForPair alternates first mover by repetition number', () => {
  const variants = [{ id: 'baseline' }, { id: 'candidate' }]

  assert.deepEqual(
    orderVariantsForPair(variants, { repetition: 1 }).map(v => v.id),
    ['baseline', 'candidate']
  )
  assert.deepEqual(
    orderVariantsForPair(variants, { repetition: 2 }).map(v => v.id),
    ['candidate', 'baseline']
  )
  assert.deepEqual(
    orderVariantsForPair(variants, { repetition: 5 }).map(v => v.id),
    ['baseline', 'candidate']
  )
})
