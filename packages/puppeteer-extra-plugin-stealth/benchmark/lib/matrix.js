'use strict'

function expandPairs(config) {
  const pairs = []
  for (const site of config.sites) {
    for (const flow of site.flows) {
      if (flow.enabled === false) continue
      for (const lane of config.lanes) {
        for (const profileMode of config.profileModes) {
          for (const pass of config.passes) {
            for (let repetition = 1; repetition <= config.repetitions.default; repetition += 1) {
              const pairId = [site.id, flow.id, lane.id, profileMode.id, pass.id, `r${repetition}`].join('__')
              pairs.push({
                pairId,
                site,
                flow,
                lane,
                profileMode,
                pass,
                repetition,
                variants: config.variants.map(variant => ({
                  variantId: variant.id,
                  pairId,
                  runId: `${pairId}__${variant.id}`
                }))
              })
            }
          }
        }
      }
    }
  }
  return pairs
}

module.exports = {
  expandPairs
}
