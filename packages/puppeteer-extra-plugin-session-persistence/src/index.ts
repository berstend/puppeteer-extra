import { PuppeteerExtraPluginSessionPersistence } from './puppeteerExtraPluginSessionPersistence';
import { PluginOptions } from './types';

export default (options: Partial<PluginOptions> = {}) => {
    return new PuppeteerExtraPluginSessionPersistence(options);
};
