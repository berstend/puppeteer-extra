# stealth benchmark harness

Internal benchmark tooling for comparing two `puppeteer-extra-plugin-stealth` workspaces under the same website matrix.

## What it does

- expands a strict A/B matrix for **baseline vs candidate**
- runs each side in a separate workspace process
- stores raw artifacts and normalized results
- classifies blocks, captchas, challenges, timeouts, and degraded success
- aggregates markdown and JSON summaries

## Commands

```bash
# Validate and count the matrix
node packages/puppeteer-extra-plugin-stealth/benchmark/cli.js plan \
  --config packages/puppeteer-extra-plugin-stealth/benchmark/config/gs75.example.config.js

# Run a dry-run without spawning browsers
node packages/puppeteer-extra-plugin-stealth/benchmark/cli.js run \
  --config packages/puppeteer-extra-plugin-stealth/benchmark/config/gs75.example.config.js \
  --dry-run

# Run deterministic harness tests
node --test packages/puppeteer-extra-plugin-stealth/benchmark/test/*.spec.js
```

## Probe contract

Each variant entry points at a workspace checkout and a probe script. The harness writes an input JSON file, spawns the probe inside that workspace, and expects the probe to write a result JSON file.
The probe script itself can live in the shared harness checkout; the example config uses an absolute harness-side probe path so baseline and candidate workspaces do not need benchmark files copied into them.

The default real probe is `probes/playwright-extra.js` and is intended to run on `gs75` with `playwright-extra` plus `puppeteer-extra-plugin-stealth` installed in each workspace.

## 2Captcha integration

Solver recovery is command-driven on purpose. The harness only needs a compatible command that can solve the extracted captcha family. The example config is shaped to work with the `two_captcha.py` workflow documented in the `2captcha-any-captcha` skill.

## Artifact layout

The harness writes to a run root such as:

```text
benchmark-output/
  pair-results.jsonl
  summary.json
  summary.md
  pairs/
    <pair-id>/
      baseline/
        input.json
        stdout.log
        stderr.log
        result.raw.json
        result.normalized.json
      candidate/
        ...
```
