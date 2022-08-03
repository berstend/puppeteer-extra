import {
  Interface,
  // ReadLineOptions
} from 'readline'

// import chalk from 'chalk'

export { clearLine, clearScreenDown, cursorTo, emitKeypressEvents, moveCursor } from 'readline'
export { default as chalk } from 'chalk'

// = {
//   // customized exports:
//   chalk,
//   Interface: SuperInterface,
//   createInterface: createSuperInterface,
//   defaultCompleter,
// 
//   // default readline exports:
//   clearLine,
//   clearScreenDown,
//   cursorTo,
//   emitKeypressEvents,
//   moveCursor
// }

// see https://github.com/nodejs/node/blob/master/lib/readline.js
// type SuperReadLineOptions = ReadLineOptions & { colors?: { prompt?: (text: string) => void, completer?: (text: string) => void } };

/**
 * Extends the native readline interface with color support.
 *
 * A drop-in replacement for `readline`.
 *
 * Additionally accepts an options.color object with chalk colors
 * for `prompt` and `completer`.
 *
 * @todo this could be enhanced with auto complete hints in grey.
 * @todo similar to this: https://github.com/aantthony/node-color-readline
 *
 * @ignore
 *
 * @example
 * const readline = require('./super-readline')
 *
 * const rl = readline.createInterface({
 *   input: process.stdin,
 *   output: process.stdout,
 *   prompt: '> ',
 *   completer: readline.defaultCompleter([ 'bob', 'yolk' ]),
 *   colors: {
 *     prompt: readline.chalk.cyan,
 *     completer: readline.chalk.yellow
 *   }
 * })
 *
 * rl.prompt()
 */
export class SuperInterface extends Interface {
  _colors: { prompt?: (text: string) => void, completer?: (text: string) => void };
  _writingTabComplete: boolean
  _prompt: string;

  constructor(options: any) {
    super(options)
    this._colors = options.colors || {}
    this._writingTabComplete = false
    this._prompt = options.prompt || '> '
  }

  _tabComplete(lastKeypressWasTab?: boolean) {
    this._writingTabComplete = true
    ;(this as any)._tabComplete(lastKeypressWasTab)
    this._writingTabComplete = false
  }

  showTabCompletions() {
    ;(this as any)._tabComplete(true)
  }

  _writeToOutput(stringToWrite: string) {
    // colorize prompt itself
    const startsWithPrompt = stringToWrite.startsWith(this._prompt)
    if (this._colors.prompt && startsWithPrompt) {
      stringToWrite = `${this._colors.prompt(
        this._prompt
      )}${stringToWrite.replace(this._prompt, '')}`
      // @ts-ignore
      return super._writeToOutput(stringToWrite)
    }
    // colorize completer output
    if (this._colors.completer && this._writingTabComplete) {
      // @ts-ignore
      return super._writeToOutput(this._colors.completer(stringToWrite))
    }
    // anything else
    // @ts-ignore
    super._writeToOutput(stringToWrite)
  }
}

export const createInterface = function(options: any) {
  return new SuperInterface(options)
}

/**
 * A typical default completer that can be used, for convenience.
 *
 * @ignore
 */
export const defaultCompleter = (completions: any) => (line: string) => {
  const hits = completions.filter((c: string) => c.startsWith(line))
  // show all completions if none found
  const arr = hits.length ? hits : completions
  return [arr, line]
}

