import type * as pptr from 'puppeteer'

// Extend puppeteer to add types which are not exposed
declare module 'puppeteer' {
  export interface Browser {
    /* tslint:disable-next-line no-unnecessary-qualifier */
    _createPageInContext(contextId?: string): Promise<pptr.Page>
  }
}
