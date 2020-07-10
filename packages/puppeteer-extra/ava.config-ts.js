export default {
  compileEnhancements: false,
  environmentVariables: {
    TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs"}'
  },
  files: ['test/*.ts'],
  extensions: ['ts'],
  require: ['ts-node/register']
}
