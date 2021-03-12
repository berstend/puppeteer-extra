export default {
  compileEnhancements: false,
  environmentVariables: {
    TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs"}',
  },
  files: ['src/**/*.test.ts', 'test/*.ts'],
  extensions: ['ts'],
  require: ['ts-node/register'],
}
