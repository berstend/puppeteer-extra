import test from 'ava'

import { AutomationExtraPlugin, Page } from '../.'

test('should have the public class members', async (t) => {
  const pluginName = 'hello-world'
  class Plugin extends AutomationExtraPlugin {
    static id = pluginName

    constructor(opts = {}) {
      super(opts)
    }

    async onPageCreated(page: Page) {
      await this.shim(page).addScript((x: string) => {
        console.log(x)
      }, 'bar')
    }
  }
  const instance = new Plugin()

  t.true(instance.shim instanceof Function)
})
