module.exports = [
  {
    id: 'sannysoft',
    tier: 1,
    class: 'diagnostic',
    url: 'https://bot.sannysoft.com/',
    tags: ['fingerprint', 'diagnostic'],
    flows: [
      {
        id: 'landing',
        type: 'landing',
        success: { selector: '#fp' },
        actions: [{ type: 'wait', ms: 5000 }]
      }
    ]
  },
  {
    id: 'creepjs',
    tier: 1,
    class: 'diagnostic',
    url: 'https://abrahamjuliot.github.io/creepjs/',
    tags: ['fingerprint', 'diagnostic'],
    flows: [
      {
        id: 'landing',
        type: 'landing',
        success: { selector: '#fp-app' },
        actions: [{ type: 'wait', ms: 7000 }]
      }
    ]
  },
  {
    id: 'google-recaptcha-demo',
    tier: 1,
    class: 'challenge-demo',
    url: 'https://www.google.com/recaptcha/api2/demo',
    tags: ['captcha', 'recaptcha'],
    flows: [
      {
        id: 'form-start',
        type: 'form_start',
        success: { selector: '#recaptcha-demo-submit' },
        actions: [{ type: 'wait', ms: 3000 }]
      }
    ]
  },
  {
    id: 'hcaptcha-demo',
    tier: 1,
    class: 'challenge-demo',
    url: 'https://accounts.hcaptcha.com/demo',
    tags: ['captcha', 'hcaptcha'],
    flows: [
      {
        id: 'form-start',
        type: 'form_start',
        success: { text: 'hCaptcha' },
        actions: [{ type: 'wait', ms: 3000 }]
      }
    ]
  }
]
