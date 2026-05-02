# Stealth Benchmark Harness Design

## Goal
Build a rerunnable A/B benchmark harness for `puppeteer-extra-plugin-stealth` that compares an original checkout and a PR1 checkout on `gs75` across a broad website matrix.

## Core requirements
- Compare **original vs PR1** under paired conditions.
- Cover **Tier 1 diagnostic**, **Tier 2 representative production**, and **Tier 3 priority** sites.
- Cover **public and pre-auth** flows first.
- Distinguish **clean success, degraded success, captcha/challenge, soft block, hard block, timeout, runtime error**.
- Support **observe-only** and **2Captcha recovery** passes.
- Support **cold** and **warm** profile modes.
- Support **gs75 native**, **Clash Verge sticky proxy**, **US VPS IPv4**, and **US VPS IPv6** lanes.
- Run **5 paired repetitions** by default and allow escalation to **10** for unstable cases.

## Architecture
1. **Config loader**
   - JS/JSON config input.
   - Normalizes variants, lanes, passes, profile modes, sites, and flows.
2. **Matrix expander**
   - Produces strict pair units: `site × flow × lane × profile × pass × repetition`.
3. **Runner**
   - Executes each pair by spawning the same probe script inside each variant workspace.
   - Stores raw stdout/stderr, normalized JSON, and artifact paths.
4. **Probe contract**
   - Probe receives a JSON input file and writes a JSON result file.
   - Primary real probe uses `playwright-extra` + `puppeteer-extra-plugin-stealth` in headless mode.
5. **Outcome classifier**
   - Maps raw probe output to canonical outcome classes and diff severity.
6. **Reporter**
   - Aggregates global, per-tier, per-site, and per-flow summaries.

## Initial implementation scope
- Core harness modules with tests.
- Mock probe for deterministic test coverage.
- Real `playwright-extra` probe scaffold for gs75 execution.
- Starter corpus and gs75-oriented example config.
- No production-site-specific login credentials or Tier 3 proprietary targets committed to the repo.

## Why this shape
Running each variant as a separate workspace process keeps the comparison honest. It avoids accidental cross-loading of baseline and candidate code in the same Node process and mirrors how the benchmark will actually run on `gs75`.
