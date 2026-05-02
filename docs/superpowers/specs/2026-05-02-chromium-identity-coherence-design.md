# Chromium Identity Coherence Design

**Date:** 2026-05-02
**Status:** Draft for review
**Scope:** Chromium-based launchers only (`puppeteer-extra`, `playwright-extra`, `puppeteer-extra-plugin-stealth`)
**Primary Goal:** Make launched automation look as much like a real Chrome user as possible.
**Secondary Goal:** Reduce unnecessary memory, CPU, and runtime overhead by avoiding blanket spoofing.

## 1. Problem Statement

The current monorepo stealth strategy is strong on historic headless browser checks, but it is still centered on older page-level evasions and stale browser assumptions. The repo has not been materially refreshed since 2023, while current Chrome behavior has shifted in several important areas:

- UA Client Hints (`userAgentData`) and related metadata have evolved.
- Modern headless Chrome already fixes several old leaks (`navigator.plugins`, media codec support, permissions behavior, `navigator.webdriver` under certain flags).
- Apple Silicon, newer Chrome versions, and newer plugin/mimeType surfaces are not reflected in the current static fixtures.
- `playwright-extra` still behaves like a compatibility bridge for Puppeteer plugins instead of a first-class stealth runtime.
- Stealth defaults are static, even when native Chromium behavior is already sufficiently realistic.

The result is a strategy that can over-spoof, under-spoof, or introduce contradictions.

## 2. Design Goals

### Primary

1. **Identity coherence over isolated spoofing**
   - UA, UA-CH, platform, locale, plugin/mimeType surface, and selected native signals should agree.
2. **Prefer native Chrome truth when plausible**
   - If a current Chromium/Chrome runtime already exposes a realistic surface, do not patch it.
3. **Chromium-only correctness first**
   - Optimize for Chrome/Chromium launchers only in this milestone.
4. **Playwright and Puppeteer parity**
   - Chromium automation should receive the same identity policy regardless of framework.

### Secondary

5. **Lower overhead through selective patching**
   - Avoid loading/injecting evasions that are unnecessary for the current runtime.
6. **Preserve compatibility**
   - Existing users should keep working with current plugin entrypoints.

## 3. Non-Goals

This milestone does **not** aim to:

- support Firefox or WebKit stealth parity,
- fully solve transport-layer/TLS fingerprinting,
- introduce a full fleet persona/proxy orchestration system,
- rewrite every stealth evasion in one PR,
- guarantee invisibility against sophisticated anti-bot systems.

## 4. Architectural Direction

The repo should move from a **bag of independent evasions** to a **Chromium identity coherence layer**.

Instead of each evasion inventing old defaults independently, a shared identity resolver should compute the Chromium-facing identity for the current launch/runtime. Evasions should then either:

- consume that identity, or
- no-op when the native runtime is already acceptable.

### Core Principle

> Real Chrome coherence beats broad synthetic spoofing.

## 5. Proposed New Component

## 5.1 Chromium Identity Resolver

Introduce a new internal module/package responsible for resolving a Chromium identity profile at runtime.

Suggested initial placement:

- internal to stealth package first, e.g. `packages/puppeteer-extra-plugin-stealth/evasions/_identity/*`

Potential later extraction:

- dedicated package after the API stabilizes.

### Responsibilities

The resolver should compute a coherent identity object containing at least:

- browser family (`chrome` vs `chromium`)
- launch mode (`headless`, `headful`, `connect`, `connectOverCDP`)
- browser version and major version
- UA string
- UA-CH metadata
- platform and architecture
- locale / languages
- hardware concurrency policy
- plugin/mimeType fixture choice
- WebGL fixture choice
- per-evasion gating decisions

### Inputs

- launch options
- framework (`puppeteer` or `playwright`)
- browser version when available
- browser channel when available
- user overrides
- explicit identity policy options

### Outputs

A resolved identity object, for example conceptually:

```ts
interface ChromiumIdentity {
  browserFamily: 'chrome' | 'chromium'
  browserMajorVersion: number | null
  browserFullVersion: string | null
  headless: boolean | 'new' | null
  userAgent: string
  userAgentMetadata: {
    brands: Array<{ brand: string; version: string }>
    fullVersion: string
    platform: string
    platformVersion: string
    architecture: string
    model: string
    mobile: boolean
  }
  locale: string
  languages: string[]
  platform: string
  hardwareConcurrency: number | null
  pluginFixtureId: string | null
  webglFixtureId: string | null
  gates: Record<string, 'native-ok' | 'patch' | 'disable'>
}
```

## 6. Integration Model

## 6.1 Stealth Package Integration

The following evasions should be refactored first to read from identity instead of hardcoded legacy defaults:

1. `user-agent-override`
2. `navigator.plugins`
3. `navigator.hardwareConcurrency`
4. `navigator.languages`
5. `navigator.permissions`
6. `webgl.vendor`
7. `media.codecs`

### Required behavior change

Each evasion should support:

- **native-ok:** do nothing
- **patch:** apply modernized patch using identity values
- **disable:** stay off entirely when harmful or obsolete

## 6.2 Playwright Integration

`playwright-extra` must become a first-class Chromium identity carrier rather than only a Puppeteer plugin shim.

Required changes:

- pass identity-aware launch information earlier,
- support context-level identity setup cleanly,
- avoid relying on fragile extra navigations for correctness,
- ensure Playwright Chromium gets equivalent identity defaults to Puppeteer Chromium.

## 6.3 Profile / Preference Integration

Existing packages should be used as building blocks:

- `puppeteer-extra-plugin-user-data-dir`
- `puppeteer-extra-plugin-user-preferences`

This milestone should make them usable as identity enablers, especially for:

- locale preferences,
- Chromium profile consistency,
- later `Local State` support in follow-up work.

## 7. Phased PR Plan

## PR 1 — Identity Core + UA Coherence

### Goal

Create the identity resolver and modernize UA coherence first.

### Files most likely touched

- `packages/puppeteer-extra-plugin-stealth/index.js`
- `packages/puppeteer-extra-plugin-stealth/evasions/user-agent-override/*`
- new identity helper module(s)
- `packages/playwright-extra/src/extra.ts`
- `packages/playwright-extra/src/plugins.ts`
- related tests

### Deliverables

- internal Chromium identity resolver
- framework-aware identity preparation path
- modernized `user-agent-override`
- reduce or remove unconditional Linux→Windows masking as default behavior
- improved current-Chrome UA-CH derivation strategy
- test coverage for UA, UA-CH, locale, platform

## PR 2 — Native Surface Modernization

### Goal

Replace stale hardcoded surface assumptions.

### Deliverables

- modern plugin/mimeType fixtures
- modern hardwareConcurrency policy
- better WebGL fixture selection
- dynamic no-op behavior for native-correct media codecs
- recalibrated language/permission behavior

## PR 3 — Profile Coherence

### Goal

Tie identity to persistent Chromium state more cleanly.

### Deliverables

- stronger use of profile preferences
- architecture for `Local State` support
- clearer profile realism boundaries

## PR 4 — Playwright Stealth Correctness

### Goal

Make Chromium stealth first-class in Playwright.

### Deliverables

- fix lifecycle gaps
- reduce shim fragility
- add Playwright-specific stealth validation beyond WebGL

## PR 5 — Test Modernization

### Goal

Replace stale assumptions with current Chrome baselines.

### Deliverables

- baseline capture from current real Chrome
- updated assertions for plugins, mimeTypes, permissions, UA-CH, workers
- Chromium-only benchmark coverage for Puppeteer and Playwright

## 8. Detailed Design Decisions

## 8.1 `user-agent-override`

### Current issues

- synthesizes too much from old assumptions,
- defaults to Linux masking,
- hardcodes desktop architecture to `x86`,
- uses stale grease logic patterns.

### New direction

- derive from actual Chromium version/channel when possible,
- keep explicit override support,
- prefer coherent values over generic disguise,
- avoid false desktop normalization when modern runtime already matches.

## 8.2 `navigator.plugins`

### Current issues

- static legacy data includes Native Client-era fixtures,
- current real Chrome surfaces differ substantially.

### New direction

- select fixtures by channel/version/platform,
- no-op if native plugin array already looks plausible,
- keep shape fidelity tests.

## 8.3 `navigator.hardwareConcurrency`

### Current issues

- hardcoded default of `4` is too synthetic.

### New direction

- prefer native value unless clearly implausible,
- otherwise resolve from identity bundle rather than fixed constant.

## 8.4 `navigator.languages`

### Current issues

- historic assumptions may already be obsolete in modern Chrome.

### New direction

- derive from locale/prefs when set,
- otherwise avoid patching if native behavior is already acceptable.

## 8.5 `media.codecs`

### Current issues

- real Chrome channel now already exposes several historically spoofed codec answers.

### New direction

- keep Chromium-channel gating,
- patch only when bundled Chromium/native surface still differs materially.

## 8.6 `playwright-extra`

### Current issues

- stealth support is too shallowly validated,
- some lifecycle behavior is fragile.

### New direction

- identity should be a first-class context concern,
- compatibility shim remains useful but should no longer carry the full stealth burden.

## 9. Testing Strategy

### Must-have tests for milestone 1

1. **Real Chrome baseline capture tests**
   - Chromium-only
2. **UA coherence tests**
   - UA string
   - `navigator.platform`
   - `navigator.userAgentData`
   - `Accept-Language`
3. **Playwright and Puppeteer parity tests**
4. **Headless and headful Chromium matrix tests**
5. **Worker/service-worker smoke checks** for identity drift (full parity can come later)

### Test philosophy

The repo should stop treating older public bot pages as the only oracle. They remain useful, but modern Chrome baseline comparison must become the primary reference.

## 10. Resource Usage Strategy

This design supports lower overhead by:

- reducing unnecessary evasions,
- reducing injected script work where native Chrome is already plausible,
- allowing launch-time/context-time shaping to carry more of the realism burden,
- keeping per-page spoofing narrower.

This milestone does **not** guarantee lower memory in every scenario, because using more realistic browser/profile state can be heavier than a minimal ephemeral runtime. However, it should reduce unnecessary stealth overhead.

## 11. Risks

### Risk 1: Regressions for older Chromium versions
Mitigation:
- version-aware gating
- preserve explicit override paths

### Risk 2: Playwright behavior differences remain
Mitigation:
- treat Playwright as a first-class validation target during PR 1

### Risk 3: Overfitting to one local Chrome build
Mitigation:
- use baseline capture tooling and fixture strategy, not one-off hardcoded values

### Risk 4: Scope blow-up
Mitigation:
- keep PR 1 focused on identity core + UA coherence only

## 12. Acceptance Criteria for Milestone 1

Milestone 1 is complete when:

1. a Chromium identity resolver exists,
2. `user-agent-override` uses the resolver instead of old hardcoded assumptions,
3. Puppeteer and Playwright Chromium launchers can consume the same identity logic,
4. explicit tests validate UA / UA-CH / locale / platform coherence against current Chromium expectations,
5. the design leaves room for profile coherence and modernized native-surface fixtures in follow-up PRs.

## 13. Recommendation

Proceed with **PR 1 only** after approval of this design:

> Introduce the Chromium identity resolver and modernize UA coherence first.

That is the smallest, highest-leverage slice that directly advances the primary goal of looking more like a real Chrome user while setting up the rest of the modernization work cleanly.
