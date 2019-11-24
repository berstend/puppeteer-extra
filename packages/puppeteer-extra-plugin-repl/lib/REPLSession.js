const ow = require('ow')
const readline = require('./super-readline')

class REPLSession {
  constructor(opts) {
    ow(opts, ow.object.hasKeys('obj'))
    ow(opts.obj, ow.object.hasKeys('constructor'))

    this._obj = opts.obj
    this._meta = {
      type: typeof this._obj,
      name: this._obj.constructor.name,
      members:
        Object.getOwnPropertyNames(Object.getPrototypeOf(this._obj)) || []
    }
    this._completions = [].concat(this.extraMethods, this._meta.members)
  }

  get extraMethods() {
    return ['inspect', 'exit']
  }

  async start() {
    this._createInterface()
    this._showIntro()
    this._rl.prompt()
    return this._closePromise
  }

  _createInterface() {
    this._rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this._meta.name ? `> ${this._meta.name.toLowerCase()}.` : `> `,
      completer: readline.defaultCompleter(this._completions),
      colors: {
        prompt: readline.chalk.cyan,
        completer: readline.chalk.yellow
      }
    })
    this._rl.on('line', this._onLineInput.bind(this))
    this._closePromise = new Promise(resolve =>
      this._rl.once('close', () => resolve())
    )
  }

  _showIntro() {
    console.log(`
      Started puppeteer-extra repl for ${this._meta.type} '${this._meta.name}' with ${this._meta.members.length} properties.

        - Type 'inspect' to return the current ${this._meta.type}.
        - Type 'exit' to leave the repl.

      Tab auto-completion available:
    `)
    this._rl.showTabCompletions()
  }

  async _onLineInput(line) {
    if (!line) {
      return this._rl.prompt()
    }
    if (line === 'exit') {
      return this._rl.close()
    }

    const cmd = line === 'inspect' ? this._obj : `this._obj.${line}`
    await this._evalAsync(cmd)
    this._rl.prompt()
  }

  async _evalAsync(cmd) {
    try {
      // eslint-disable-next-line no-eval
      const out = await eval(cmd)
      console.log(out)
    } catch (err) {
      console.warn(err)
    }
  }
}

module.exports = REPLSession
