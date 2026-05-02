module.exports = [
  {
    id: 'github',
    tier: 2,
    class: 'developer',
    url: 'https://github.com/',
    tags: ['docs', 'auth-entry'],
    flows: [
      {
        id: 'landing',
        type: 'landing',
        success: { selector: 'header' },
        actions: [{ type: 'wait', ms: 2500 }]
      },
      {
        id: 'login-entry',
        type: 'form_start',
        success: { urlIncludes: '/login' },
        actions: [
          { type: 'click', selector: 'a[href="/login"]' },
          { type: 'wait', ms: 1500 }
        ]
      }
    ]
  },
  {
    id: 'mdn',
    tier: 2,
    class: 'docs',
    url: 'https://developer.mozilla.org/',
    tags: ['search', 'content'],
    flows: [
      {
        id: 'landing',
        type: 'landing',
        success: { selector: 'main' },
        actions: [{ type: 'wait', ms: 2500 }]
      },
      {
        id: 'search',
        type: 'search',
        success: { urlIncludes: '/search' },
        actions: [
          { type: 'click', selector: 'button[data-search-button]' },
          { type: 'type', selector: 'input[type="search"]', text: 'fetch api' },
          { type: 'press', selector: 'input[type="search"]', key: 'Enter' },
          { type: 'wait', ms: 2500 }
        ]
      }
    ]
  },
  {
    id: 'npmjs',
    tier: 2,
    class: 'marketplace',
    url: 'https://www.npmjs.com/',
    tags: ['search', 'catalog'],
    flows: [
      {
        id: 'landing',
        type: 'landing',
        success: { selector: 'header' },
        actions: [{ type: 'wait', ms: 2500 }]
      },
      {
        id: 'search',
        type: 'search',
        success: { urlIncludes: '/search' },
        actions: [
          { type: 'type', selector: 'input[type="search"]', text: 'puppeteer-extra' },
          { type: 'press', selector: 'input[type="search"]', key: 'Enter' },
          { type: 'wait', ms: 2500 }
        ]
      }
    ]
  }
]
