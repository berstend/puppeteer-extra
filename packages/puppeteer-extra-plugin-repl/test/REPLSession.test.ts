import test from 'ava'
import REPLSession from '../src/lib/REPLSession'

test('is a function', async t => {
  t.is(typeof REPLSession, 'function')
})

test('is a class', async t => {
  t.is(REPLSession.constructor.name, 'Function')
})

test('will throw without opts', async t => {
  // @ts-ignore
  const error = await t.throws(() => new REPLSession())
  t.regex(
    error.message,
    /Expected argument to be of type `object` but received type `undefined`/
  )
})

// test('will throw when opts.obj is not a class derivative', async t => {
//   const error = await t.throws(() => new REPLSession({ obj: 'foobar' }))
//   t.regex(
//     error.message,
//     /Expected argument to be of type `object` but received type `string`/
//   )
// })

class FakeClass {
  constructor() {
  }
}

test('should have the expected class members', async t => {
  const obj = new FakeClass();
  const opts = { obj }
  const instance = new REPLSession(opts)
  const prototype = Object.getPrototypeOf(instance)
  const childClassMembers = Object.getOwnPropertyNames(prototype)

  t.true(childClassMembers.includes('constructor'))
  t.true(childClassMembers.includes('extraMethods'))
  t.true(childClassMembers.includes('start'))
  t.true(childClassMembers.includes('_createInterface'))
  t.true(childClassMembers.includes('_showIntro'))
  t.true(childClassMembers.includes('_onLineInput'))
  t.true(childClassMembers.includes('_evalAsync'))
  t.true(childClassMembers.length === 7)
})
