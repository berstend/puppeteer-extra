import ow from 'ow'
import * as readline from './super-readline'
import chalk from 'chalk'

export default class REPLSession {
  private _obj: any;
  private _meta: {
    type: string;
    name: string;
    members: string[];
  }
  private _rl!: readline.SuperInterface;
  private _completions: string[];
  private _closePromise?: Promise<void>;

  constructor(opts: any) {
    ow(opts, ow.object.hasKeys('obj'))
    ow(opts.obj, ow.object.hasKeys('constructor'))

    this._obj = opts.obj
    this._meta = {
      type: typeof this._obj,
      name: this._obj.constructor.name,
      members:
        Object.getOwnPropertyNames(Object.getPrototypeOf(this._obj)) || []
    }
    this._completions = [...this.extraMethods, ...this._meta.members]
  }

  get extraMethods(): string[] {
    return ['inspect', 'exit']
  }

  async start(): Promise<void> {
    this._createInterface()
    this._showIntro()
    this._rl.prompt()
    return this._closePromise
  }

  _createInterface(): void {
    this._rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this._meta.name ? `> ${this._meta.name.toLowerCase()}.` : `> `,
      completer: readline.defaultCompleter(this._completions),
      colors: {
        prompt: chalk.cyan,
        completer: chalk.yellow
      }
    })
    this._rl.on('line', this._onLineInput.bind(this))
    this._closePromise = new Promise(resolve =>
      this._rl.once('close', () => resolve())
    )
  }

  _showIntro(): void {
    console.log(`
      Started puppeteer-extra repl for ${this._meta.type} '${this._meta.name}' with ${this._meta.members.length} properties.

        - Type 'inspect' to return the current ${this._meta.type}.
        - Type 'exit' to leave the repl.

      Tab auto-completion available:
    `)
    this._rl.showTabCompletions()
  }

  async _onLineInput(line: string): Promise<void> {
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

  async _evalAsync(cmd: string): Promise<void> {
    try {
      // eslint-disable-next-line no-eval
      const out = await eval(cmd)
      console.log(out)
    } catch (err) {
      console.warn(err)
    }
  }
}
