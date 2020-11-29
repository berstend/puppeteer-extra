export {}

// https://github.com/avajs/ava/issues/2332
declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}
