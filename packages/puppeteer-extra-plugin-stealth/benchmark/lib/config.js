'use strict'

const fs = require('fs')
const path = require('path')

async function loadConfig(configPath) {
  const absolutePath = path.resolve(configPath)
  const loaded = absolutePath.endsWith('.json')
    ? JSON.parse(await fs.promises.readFile(absolutePath, 'utf8'))
    : require(absolutePath)
  return normalizeConfig(loaded, path.dirname(absolutePath), absolutePath)
}

function normalizeConfig(config, baseDir, sourcePath = '<inline>') {
  if (!config || typeof config !== 'object') {
    throw new Error(`Invalid config at ${sourcePath}: expected an object`)
  }

  const variants = Array.isArray(config.variants) ? config.variants.slice() : []
  if (variants.length !== 2) {
    throw new Error(`Invalid config at ${sourcePath}: expected exactly 2 variants`) 
  }

  const lanes = ensureNonEmptyArray(config.lanes, 'lanes', sourcePath)
  const sites = ensureNonEmptyArray(config.sites, 'sites', sourcePath)

  const profileModes = (config.profileModes && config.profileModes.length
    ? config.profileModes
    : [{ id: 'cold', label: 'Cold profile', strategy: 'fresh' }]
  ).map(profile => normalizeProfile(profile))

  const passes = (config.passes && config.passes.length
    ? config.passes
    : [{ id: 'observe', label: 'Observe only', solverMode: 'disabled' }]
  ).map(pass => normalizePass(pass))

  const repetitions = normalizeRepetitions(config.repetitions)
  const artifactsRoot = path.resolve(baseDir, (config.artifacts && config.artifacts.rootDir) || 'benchmark-output')

  return {
    name: config.name || 'stealth-benchmark',
    sourcePath,
    baseDir,
    variants: variants.map(variant => normalizeVariant(variant, baseDir, sourcePath)),
    lanes: lanes.map(lane => normalizeLane(lane)),
    profileModes,
    passes,
    repetitions,
    artifacts: {
      rootDir: artifactsRoot
    },
    sites: sites.map(site => normalizeSite(site))
  }
}

function ensureNonEmptyArray(value, label, sourcePath) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid config at ${sourcePath}: expected non-empty ${label}`)
  }
  return value
}

function normalizeVariant(variant, baseDir, sourcePath) {
  if (!variant || !variant.id) {
    throw new Error(`Invalid config at ${sourcePath}: each variant requires an id`)
  }
  if (!variant.workspacePath) {
    throw new Error(`Invalid config at ${sourcePath}: variant ${variant.id} requires workspacePath`)
  }
  const probe = variant.probe || {}
  if (!probe.script && !probe.command) {
    throw new Error(`Invalid config at ${sourcePath}: variant ${variant.id} requires probe.script or probe.command`)
  }
  return {
    id: variant.id,
    label: variant.label || variant.id,
    workspacePath: path.resolve(baseDir, variant.workspacePath),
    env: Object.assign({}, variant.env),
    probe: {
      script: probe.script ? String(probe.script) : null,
      command: probe.command ? String(probe.command) : null
    }
  }
}

function normalizeLane(lane) {
  if (!lane || !lane.id) {
    throw new Error('Each lane requires an id')
  }
  return {
    id: lane.id,
    label: lane.label || lane.id,
    kind: lane.kind || 'native',
    proxyServer: lane.proxyServer || null,
    env: Object.assign({}, lane.env),
    browser: Object.assign({ headless: true }, lane.browser),
    network: Object.assign({}, lane.network),
    tags: Array.isArray(lane.tags) ? lane.tags.slice() : []
  }
}

function normalizeProfile(profile) {
  if (!profile || !profile.id) {
    throw new Error('Each profile mode requires an id')
  }
  return {
    id: profile.id,
    label: profile.label || profile.id,
    strategy: profile.strategy || 'fresh',
    browser: Object.assign({}, profile.browser)
  }
}

function normalizePass(pass) {
  if (!pass || !pass.id) {
    throw new Error('Each pass requires an id')
  }
  return {
    id: pass.id,
    label: pass.label || pass.id,
    solverMode: pass.solverMode || 'disabled',
    solver: Object.assign({}, pass.solver)
  }
}

function normalizeRepetitions(repetitions) {
  if (!repetitions) {
    return { default: 5, escalateTo: 10 }
  }
  return {
    default: Number(repetitions.default || 5),
    escalateTo: Number(repetitions.escalateTo || 10)
  }
}

function normalizeSite(site) {
  if (!site || !site.id || !site.url) {
    throw new Error('Each site requires id and url')
  }
  const flows = ensureNonEmptyArray(site.flows, `flows for site ${site.id}`, site.id).map(flow => normalizeFlow(flow, site))
  return Object.assign({}, site, {
    tier: site.tier || 2,
    class: site.class || 'generic',
    tags: Array.isArray(site.tags) ? site.tags.slice() : [],
    flows
  })
}

function normalizeFlow(flow, site) {
  if (!flow || !flow.id || !flow.type) {
    throw new Error(`Each flow requires id and type (site: ${site.id})`)
  }
  return Object.assign(
    {
      enabled: true,
      actions: [],
      success: {},
      degradeOnMissingSelectors: []
    },
    flow
  )
}

module.exports = {
  loadConfig,
  normalizeConfig
}
