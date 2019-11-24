const chalk = require('chalk')

const {
  Interface,
  clearLine,
  clearScreenDown,
  cursorTo,
  emitKeypressEvents,
  moveCursor
} = require('readline')

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
class SuperInterface extends Interface {
  constructor(options) {
    super(options)
    this._colors = options.colors || {}
    this._writingTabComplete = false
  }

  _tabComplete(lastKeypressWasTab) {
    this._writingTabComplete = true
    super._tabComplete(lastKeypressWasTab)
    this._writingTabComplete = false
  }

  showTabCompletions() {
    this._tabComplete(true)
  }

  _writeToOutput(stringToWrite) {
    // colorize prompt itself
    const startsWithPrompt = stringToWrite.startsWith(this._prompt)
    if (this._colors.prompt && startsWithPrompt) {
      stringToWrite = `${this._colors.prompt(
        this._prompt
      )}${stringToWrite.replace(this._prompt, '')}`
      return super._writeToOutput(stringToWrite)
    }
    // colorize completer output
    if (this._colors.completer && this._writingTabComplete) {
      return super._writeToOutput(this._colors.completer(stringToWrite))
    }
    // anything else
    super._writeToOutput(stringToWrite)
  }
}

const createSuperInterface = function(options) {
  return new SuperInterface(options)
}

/**
 * A typical default completer that can be used, for convenience.
 *
 * @ignore
 */
const defaultCompleter = completions => line => {
  const hits = completions.filter(c => c.startsWith(line))
  // show all completions if none found
  const arr = hits.length ? hits : completions
  return [arr, line]
}

module.exports = {
  // customized exports:
  chalk,
  Interface: SuperInterface,
  createInterface: createSuperInterface,
  defaultCompleter,

  // default readline exports:
  clearLine,
  clearScreenDown,
  cursorTo,
  emitKeypressEvents,
  moveCursor
}
