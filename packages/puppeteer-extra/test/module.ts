import test from 'ava'

import pwModule from '../src/index'

test('is an object', async t => {
  t.is(typeof pwModule, 'object')
})

test('should have the additional exports', async t => {
  t.true(pwModule.use instanceof Object)
  t.true(pwModule.plugins instanceof Object)
})
