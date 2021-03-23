export default {
  environmentVariables: {
    TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs"}'
  },
  files: ['test/**.test.ts'],
  extensions: ['ts'],
  require: ['ts-node/register']
}
