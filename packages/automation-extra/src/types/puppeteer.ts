/* eslint @typescript-eslint/method-signature-style: 0 */
import type * as types from 'puppeteer'

/**
 * Extend ambient Puppeteer types to expose untyped methods and properties.
 */
declare module 'puppeteer' {
  export type EvaluateHandleFn = string | ((...args: unknown[]) => unknown)

  export interface Browser {
    readonly _createPageInContext: (contextId?: string) => Promise<Page>
    readonly _defaultContext: types.BrowserContext
  }

  export interface Page {
    readonly _client: types.CDPSession
    readonly _frameManager: FrameManager
    readonly _workers: Map<string, WebWorker>
  }

  export interface WebWorker {
    readonly _client: types.CDPSession
    readonly _url: string
    readonly _executionContextPromise: Promise<types.ExecutionContext>
    readonly _executionContextCallback: (value: types.ExecutionContext) => void

    url(): string

    executionContext(): Promise<types.ExecutionContext>

    evaluate<ReturnType extends any>(
      pageFunction: Function | string,
      ...args: any[]
    ): Promise<ReturnType>

    evaluateHandle(
      pageFunction: EvaluateHandleFn,
      ...args: types.SerializableOrJSHandle[]
    ): Promise<types.JSHandle>
  }

  export interface FrameManager {
    readonly _client: types.CDPSession
    readonly _page: Page
    readonly _frames: Map<string, types.Frame>
    readonly _contextIdToContext: Map<number, types.ExecutionContext>
    readonly _isolatedWorlds: Set<string>
    readonly _mainFrame: types.Frame

    initialize(): Promise<void>

    page(): Page

    mainFrame(): types.Frame

    frames(): types.Frame[]

    frame(frameId: string): types.Frame | null

    executionContextById(contextId: number): types.ExecutionContext

    _removeFramesRecursively(frame: types.Frame): void
  }
}
