/// <reference path="./puppeteer-legacy.d.ts" />
import { PuppeteerNode, Browser, Page } from 'puppeteer'

/**
 * Original Puppeteer API
 * @private
 */
export interface VanillaPuppeteer
    extends Pick<
    PuppeteerNode,
    | 'connect'
    | 'defaultArgs'
    | 'executablePath'
    | 'launch'
    | 'createBrowserFetcher'
    > { }

export declare type PuppeteerLaunchOption = Parameters<VanillaPuppeteer['launch']>[0];

export interface BrowserEventOptions {
    context: 'launch' | 'connect';
    options: PuppeteerLaunchOption;
    defaultArgs?: (options?: Parameters<VanillaPuppeteer['defaultArgs']>[0]) => ReturnType<VanillaPuppeteer['defaultArgs']>
}

export type PluginRequirements = Set<'launch' | 'headful' | 'dataFromPlugins' | 'runLast'>
export type PluginDependencies = string[]
export interface PluginData {
    name: string,
    value: {
        [key: string]: any
    }
}

/**
 * Minimal plugin interface
 * @private
 */
export interface PuppeteerExtraPlugin {
    name: string;
    get defaults(): any;
    get requirements(): PluginRequirements;
    get dependencies(): PluginDependencies;
    get data(): PluginData[];
    get opts(): any;
    get dependenciesOptions(): {[key: string]: any};
    // drop overcomplicated function
    // _getMissingDependencies(plugins: PuppeteerExtraPlugin[]): Set<string>;
    getDataFromPlugins(name?: string): PluginData[];
    _isPuppeteerExtraPlugin: boolean;
    [propName: string]: any;
}

/**
 * We need to hook into non-public APIs in rare occasions to fix puppeteer bugs. :(
 * @private
 */
export interface BrowserInternals extends Browser {
    _createPageInContext(contextId?: string): Promise<Page>
}
