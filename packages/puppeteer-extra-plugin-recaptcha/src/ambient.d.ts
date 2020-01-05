export {}

// https://github.com/sindresorhus/type-fest/issues/19
declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}
