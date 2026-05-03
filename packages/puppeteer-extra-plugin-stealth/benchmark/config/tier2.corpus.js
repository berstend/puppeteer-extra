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
        url: 'https://github.com/login',
        success: { urlIncludes: '/login' },
        actions: [{ type: 'wait', ms: 1500 }]
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
        success: { selector: 'body.page-layout' },
        actions: [{ type: 'wait', ms: 2500 }]
      },
      {
        id: 'search',
        type: 'search',
        url: 'https://developer.mozilla.org/en-US/search?q=fetch+api',
        success: { urlIncludes: '/search' },
        actions: [{ type: 'wait', ms: 2500 }]
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
        url: 'https://www.npmjs.com/search?q=puppeteer-extra',
        success: { urlIncludes: '/search' },
        actions: [{ type: 'wait', ms: 2500 }]
      }
    ]
  }
]
