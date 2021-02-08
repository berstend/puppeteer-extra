export default {
  environmentVariables: {
    TS_NODE_FILES: 'true',
    TS_NODE_PROJECT: './tsconfig.build.json'
  },
  files: ['test/*.ts'],
  extensions: ['ts'],
  require: ['ts-node/register'],
  timeout: '120s' // https://github.com/avajs/ava/issues/2494
}
