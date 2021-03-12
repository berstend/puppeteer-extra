export default {
  environmentVariables: {
    TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs"}',
    TS_NODE_FILES: 'true',
    TS_NODE_PROJECT: './tsconfig.json'
  },
  files: ['test/*.ts'],
  extensions: ['ts'],
  require: ['ts-node/register'],
  timeout: '15s' // https://github.com/avajs/ava/issues/2494
}
