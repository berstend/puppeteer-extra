/// <reference types="node" />

import { EventEmitter } from 'events';
import 'puppeteer';
import { PuppeteerExtraPlugin, PluginOptions } from 'puppeteer-extra-plugin';

// augment repl() for Page/Browser

declare module 'puppeteer' {
    export interface Page extends EventEmitter, FrameBase {
        repl(): Promise<void>;
    }

    export interface Browser extends EventEmitter, TargetAwaiter {
        repl(): Promise<void>;
    }
}

/**
 * Create an interactive REPL for the provided object.
 * Uses an extended (colorized) readline interface under the hood. Will resolve the returned Promise when the readline interface is closed.
 * If opts.addToPuppeteerClass is true (default) then page.repl()/browser.repl() will point to this method, for convenience.
 * Can be used standalone as well, to inspect an arbitrary class instance or object.
 */
declare function repl(config?: Options): Plugin;

declare interface Options extends DefaultOptions, PluginOptions {}

declare interface DefaultOptions {
    /**
     * If a .repl() method should be attached to Puppeteer Page and Browser instances
     * @default true
     */
    addToPuppeteerClass?: boolean;
}

declare class Plugin extends PuppeteerExtraPlugin {
    get name(): 'repl';
    get defaults(): DefaultOptions;
    repl(obj: any): Promise<void>;
}

export = repl;
