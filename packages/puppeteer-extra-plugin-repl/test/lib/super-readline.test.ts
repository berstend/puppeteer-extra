import test from 'ava'

import * as readline from '../../src/lib/super-readline'

test('is an object', async t => {
  t.is(typeof readline, 'object')
})

test('should have the expected number of exports', async t => {
  const exportedKeys = Object.keys(readline)

  t.true(exportedKeys.includes('chalk'))
  t.true(exportedKeys.includes('Interface'))
  t.true(exportedKeys.includes('createInterface'))
  t.true(exportedKeys.includes('defaultCompleter'))
  t.true(exportedKeys.includes('clearLine'))
  t.true(exportedKeys.includes('clearScreenDown'))
  t.true(exportedKeys.includes('cursorTo'))
  t.true(exportedKeys.includes('emitKeypressEvents'))
  t.true(exportedKeys.includes('moveCursor'))
  t.is(exportedKeys.length, 9)
})

test('can create an interface', async t => {
  const instance = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    completer: readline.defaultCompleter(['bob', 'yolk']),
    colors: {
      prompt: readline.chalk.cyan,
      completer: readline.chalk.yellow
    }
  })
  t.is(instance.constructor.name, 'SuperInterface')
  t.is(typeof instance, 'object')
})

test('should have the extended class members', async t => {
  const instance = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    completer: readline.defaultCompleter(['bob', 'yolk']),
    colors: {
      prompt: readline.chalk.cyan,
      completer: readline.chalk.yellow
    }
  })
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('_tabComplete'))
  t.true(childClassMembers.includes('_writeToOutput'))
  t.true(childClassMembers.includes('showTabCompletions'))
})
