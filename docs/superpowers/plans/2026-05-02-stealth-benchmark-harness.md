# Stealth Benchmark Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a rerunnable benchmark harness that compares baseline and PR1 stealth behavior across a matrix of websites, flows, lanes, profile modes, and captcha policies.

**Architecture:** The harness loads a JS/JSON config, expands it into strict paired runs, spawns a probe inside each variant workspace, normalizes outcomes, and writes raw artifacts plus aggregate reports. A mock probe keeps the core harness testable without browser dependencies, while a real `playwright-extra` probe is available for `gs75` execution.

**Tech Stack:** Node.js built-ins, CommonJS modules, `node:test`, `playwright-extra` probe contract, 2Captcha command integration.

---

### Task 1: Add the benchmark harness skeleton

**Files:**
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/cli.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/lib/config.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/lib/matrix.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/lib/outcome.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/lib/report.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/lib/runner.js`

- [ ] Write the harness modules using only Node built-ins.
- [ ] Keep the probe contract process-based so baseline and candidate run in separate workspaces.
- [ ] Expose `plan`, `run`, and `report` CLI commands.

### Task 2: Add deterministic tests and a mock probe

**Files:**
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/probes/mock.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/test/config.spec.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/test/matrix.spec.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/test/outcome.spec.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/test/runner.spec.js`

- [ ] Cover config normalization and validation.
- [ ] Cover strict pair expansion and run IDs.
- [ ] Cover canonical outcome classification and diff severity.
- [ ] Cover end-to-end runner behavior with the mock probe.

### Task 3: Add the gs75-facing probe and configs

**Files:**
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/probes/playwright-extra.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/lib/solver.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/config/tier1.corpus.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/config/tier2.corpus.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/config/priority.corpus.example.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/config/gs75.example.config.js`
- Create: `packages/puppeteer-extra-plugin-stealth/benchmark/README.md`

- [ ] Add a headless `playwright-extra` probe that can run generic public/pre-auth flows.
- [ ] Detect challenge families and route supported cases to a 2Captcha command contract.
- [ ] Provide a starter corpus and an example gs75 matrix config.

### Task 4: Wire repo entry points and verify

**Files:**
- Modify: `packages/puppeteer-extra-plugin-stealth/package.json`
- Modify: `.gitignore`

- [ ] Add a benchmark test script and dry-run planning command.
- [ ] Ignore generated benchmark artifacts.
- [ ] Run `node --test packages/puppeteer-extra-plugin-stealth/benchmark/test/*.spec.js`.
- [ ] Run `node packages/puppeteer-extra-plugin-stealth/benchmark/cli.js plan --config packages/puppeteer-extra-plugin-stealth/benchmark/config/gs75.example.config.js`.
