declare const PuppeteerExtraPlugin: typeof import("puppeteer-extra-plugin").PuppeteerExtraPlugin;
declare const Page: typeof import("puppeteer").Page;
type CustomFn = ((ua: string) => string | null) | null;
declare class Plugin extends PuppeteerExtraPlugin {
	get name(): string;
	get defaults(): {
		stripHeadless: boolean;
		makeWindows: boolean;
		customFn: CustomFn;
	};
  async onPageCreated(page: Page): void;
	}
export default function (options?: {
	stripHeadless?: true;
	makeWindows?: true;		
  customFn?: CustomFn;
}): Plugin;
