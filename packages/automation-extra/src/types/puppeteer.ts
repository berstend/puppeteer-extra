/* eslint @typescript-eslint/method-signature-style: 0 */
import type * as types from 'puppeteer'

/**
 * Extend ambient Puppeteer types to expose untyped methods and properties.
 */
declare module 'puppeteer' {
  export type EvaluateHandleFn = string | ((...args: unknown[]) => unknown)

  export interface Browser {
    _createPageInContext: (contextId?: string) => Promise<Page>
    _defaultContext: types.BrowserContext
  }

  export interface Page {
    _client: types.CDPSession
    _frameManager: FrameManager
    _workers: Map<string, WebWorker>
  }

  export interface WebWorker {
    _client: types.CDPSession
    _url: string
    _executionContextPromise: Promise<types.ExecutionContext>
    _executionContextCallback: (value: types.ExecutionContext) => void

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
    _client: types.CDPSession
    _page: Page
    _frames: Map<string, types.Frame>
    _contextIdToContext: Map<number, types.ExecutionContext>
    _isolatedWorlds: Set<string>
    _mainFrame: types.Frame

    initialize(): Promise<void>

    page(): Page

    mainFrame(): types.Frame

    frames(): types.Frame[]

    frame(frameId: string): types.Frame | null

    executionContextById(contextId: number): types.ExecutionContext

    _removeFramesRecursively(frame: types.Frame): void
  }
}
