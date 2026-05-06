'use strict'

function buildSolveCommand({ command, websiteUrl, challenge }) {
  if (!command) {
    throw new Error('A solver command is required for 2Captcha recovery')
  }
  if (!challenge || !challenge.family) {
    throw new Error('A challenge family is required for 2Captcha recovery')
  }

  const base = command.trim().split(/\s+/)
  const args = []
  if (challenge.family === 'turnstile') {
    args.push('solve', 'turnstile', '--website-url', websiteUrl, '--website-key', challenge.siteKey)
  } else if (challenge.family === 'recaptcha') {
    args.push('solve', 'recaptcha-v2', '--website-url', websiteUrl, '--website-key', challenge.siteKey)
  } else if (challenge.family === 'hcaptcha') {
    const task = JSON.stringify({
      type: 'HCaptchaTaskProxyless',
      websiteURL: websiteUrl,
      websiteKey: challenge.siteKey
    })
    args.push('solve', 'custom', '--task-json', task)
  } else {
    throw new Error(`Unsupported challenge family for solver: ${challenge.family}`)
  }
  return {
    command: base[0],
    args: base.slice(1).concat(args)
  }
}

module.exports = {
  buildSolveCommand
}
