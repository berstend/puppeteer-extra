[puppeteer-extra-plugin](../README.md) > [PuppeteerExtraPlugin](../classes/puppeteerextraplugin.md)

# Class: PuppeteerExtraPlugin

Base class for `puppeteer-extra` plugins.

Provides convenience methods to avoid boilerplate.

All common `puppeteer` browser events will be bound to the plugin instance, if a respectively named class member is found.

Please refer to the [puppeteer API documentation](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) as well.

*__example__*:
 ```js
// hello-world-plugin.js
const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) { super(opts) }

  get name () { return 'hello-world' }

  async onPageCreated (page) {
    this.debug('page created', page.url())
    const ua = await page.browser().userAgent()
    this.debug('user agent', ua)
  }
}

module.exports = function (pluginConfig) { return new Plugin(pluginConfig) }

// foo.js
const puppeteer = require('puppeteer-extra')
puppeteer.use(require('./hello-world-plugin')())

;(async () => {
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()
  await page.goto('http://example.com', {waitUntil: 'domcontentloaded'})
  await browser.close()
})()
```

## Hierarchy

**PuppeteerExtraPlugin**

## Index

### Constructors

* [constructor](puppeteerextraplugin.md#constructor)

### Accessors

* [data](puppeteerextraplugin.md#data)
* [debug](puppeteerextraplugin.md#debug)
* [defaults](puppeteerextraplugin.md#defaults)
* [dependencies](puppeteerextraplugin.md#dependencies)
* [name](puppeteerextraplugin.md#name)
* [opts](puppeteerextraplugin.md#opts)
* [requirements](puppeteerextraplugin.md#requirements)

### Methods

* [afterConnect](puppeteerextraplugin.md#afterconnect)
* [afterLaunch](puppeteerextraplugin.md#afterlaunch)
* [beforeConnect](puppeteerextraplugin.md#beforeconnect)
* [beforeLaunch](puppeteerextraplugin.md#beforelaunch)
* [getDataFromPlugins](puppeteerextraplugin.md#getdatafromplugins)
* [onBrowser](puppeteerextraplugin.md#onbrowser)
* [onClose](puppeteerextraplugin.md#onclose)
* [onDisconnected](puppeteerextraplugin.md#ondisconnected)
* [onPageCreated](puppeteerextraplugin.md#onpagecreated)
* [onPluginRegistered](puppeteerextraplugin.md#onpluginregistered)
* [onTargetChanged](puppeteerextraplugin.md#ontargetchanged)
* [onTargetCreated](puppeteerextraplugin.md#ontargetcreated)
* [onTargetDestroyed](puppeteerextraplugin.md#ontargetdestroyed)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new PuppeteerExtraPlugin**(opts?: *[PluginOptions](../interfaces/pluginoptions.md)*): [PuppeteerExtraPlugin](puppeteerextraplugin.md)

*Defined in plugin.ts:72*

**Parameters:**

| Name | Type |
| ------ | ------ |
| `Optional` opts | [PluginOptions](../interfaces/pluginoptions.md) |

**Returns:** [PuppeteerExtraPlugin](puppeteerextraplugin.md)

___

## Accessors

<a id="data"></a>

###  data

getdata(): [PluginData](../interfaces/plugindata.md)[]

*Defined in plugin.ts:211*

Plugin data (optional).

Plugins can expose data (an array of objects), which in turn can be consumed by other plugins, that list the `dataFromPlugins` requirement (by using `this.getDataFromPlugins()`).

Convention: `[ {name: 'Any name', value: 'Any value'} ]`

*__see__*: [getDataFromPlugins](puppeteerextraplugin.md#getdatafromplugins)

*__example__*:
 ```js
// plugin1.js
get data () {
  return [
    {
      name: 'userPreferences',
      value: { foo: 'bar' }
    },
    {
      name: 'userPreferences',
      value: { hello: 'world' }
    }
  ]

// plugin2.js
get requirements () { return new Set(['dataFromPlugins']) }

async beforeLaunch () {
  const prefs = this.getDataFromPlugins('userPreferences').map(d => d.value)
  this.debug(prefs) // => [ { foo: 'bar' }, { hello: 'world' } ]
}
```

**Returns:** [PluginData](../interfaces/plugindata.md)[]

___
<a id="debug"></a>

###  debug

getdebug(): `Debugger`

*Defined in plugin.ts:254*

Convenience debug logger based on the \[debug\] module. Will automatically namespace the logging output to the plugin package name. \[debug\]: [https://www.npmjs.com/package/debug](https://www.npmjs.com/package/debug)

```bash
 # toggle output using environment variables
 DEBUG=puppeteer-extra-plugin:<plugin_name> node foo.js
 # to debug all the things:
 DEBUG=puppeteer-extra,puppeteer-extra-plugin:* node foo.js
```

*__example__*:
 ```js
this.debug('hello world')
// will output e.g. 'puppeteer-extra-plugin:anonymize-ua hello world'
```

**Returns:** `Debugger`

___
<a id="defaults"></a>

###  defaults

getdefaults(): [PluginOptions](../interfaces/pluginoptions.md)

*Defined in plugin.ts:126*

Plugin defaults (optional).

If defined will be ([deep-](https://github.com/jonschlinkert/merge-deep))merged with the (optional) user supplied options (supplied during plugin instantiation).

The result of merging defaults with user supplied options can be accessed through `this.opts`.

*__see__*: [opts](puppeteerextraplugin.md#opts)

*__example__*:
 ```js
get defaults () {
  return {
    stripHeadless: true,
    makeWindows: true,
    customFn: null
  }
}

// Users can overwrite plugin defaults during instantiation:
puppeteer.use(require('puppeteer-extra-plugin-foobar')({ makeWindows: false }))
```

**Returns:** [PluginOptions](../interfaces/pluginoptions.md)

___
<a id="dependencies"></a>

###  dependencies

getdependencies(): [PluginDependencies](../#plugindependencies)

*Defined in plugin.ts:173*

Plugin dependencies (optional).

Missing plugins will be required() by puppeteer-extra.

*__example__*:
 ```js
get dependencies () {
  return new Set(['user-preferences'])
}
// Will ensure the 'puppeteer-extra-plugin-user-preferences' plugin is loaded.
```

**Returns:** [PluginDependencies](../#plugindependencies)

___
<a id="name"></a>

###  name

getname(): `string`

*Defined in plugin.ts:99*

Plugin name (required).

Convention:

*   Package: `puppeteer-extra-plugin-anonymize-ua`
*   Name: `anonymize-ua`

*__example__*:
 ```js
get name () { return 'anonymize-ua' }
```

**Returns:** `string`

___
<a id="opts"></a>

###  opts

getopts(): [PluginOptions](../interfaces/pluginoptions.md)

*Defined in plugin.ts:232*

Access the plugin options (usually the `defaults` merged with user defined options)

To skip the auto-merging of defaults with user supplied opts don't define a `defaults` property and set the `this._opts` Object in your plugin constructor directly.

*__see__*: [defaults](puppeteerextraplugin.md#defaults)

*__example__*:
 ```js
get defaults () { return { foo: "bar" } }

async onPageCreated (page) {
  this.debug(this.opts.foo) // => bar
}
```

**Returns:** [PluginOptions](../interfaces/pluginoptions.md)

___
<a id="requirements"></a>

###  requirements

getrequirements(): [PluginRequirements](../#pluginrequirements)

*Defined in plugin.ts:156*

Plugin requirements (optional).

Signal certain plugin requirements to the base class and the user.

Currently supported:

*   `launch`
    *   If the plugin only supports locally created browser instances (no `puppeteer.connect()`), will output a warning to the user.
*   `headful`
    *   If the plugin doesn't work in `headless: true` mode, will output a warning to the user.
*   `dataFromPlugins`
    *   In case the plugin requires data from other plugins. will enable usage of `this.getDataFromPlugins()`.
*   `runLast`
    *   In case the plugin prefers to run after the others. Useful when the plugin needs data from others.

*__example__*:
 ```js
get requirements () {
  return new Set(['runLast', 'dataFromPlugins'])
}
```

**Returns:** [PluginRequirements](../#pluginrequirements)

___

## Methods

<a id="afterconnect"></a>

### `<Optional>` afterConnect

▸ **afterConnect**(browser: *`Browser`*, opts?: *`object`*): `Promise`<`void`>

*Defined in plugin.ts:342*

After connecting to an existing browser instance.

> Note: Don't assume that there will only be a single browser instance during the lifecycle of a plugin.

**Parameters:**

| Name | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| browser | `Browser` | - |  The \`puppeteer\` browser instance. |
| `Default value` opts | `object` |  {} |  \- |

**Returns:** `Promise`<`void`>

___
<a id="afterlaunch"></a>

### `<Optional>` afterLaunch

▸ **afterLaunch**(browser: *`Browser`*, opts?: *`object`*): `Promise`<`void`>

*Defined in plugin.ts:310*

After the browser has launched.

Note: Don't assume that there will only be a single browser instance during the lifecycle of a plugin. It's possible that `pupeeteer.launch` will be called multiple times and more than one browser created. In order to make the plugins as stateless as possible don't store a reference to the browser instance in the plugin but rather consider alternatives.

E.g. when using `onPageCreated` you can get a browser reference by using `page.browser()`.

Alternatively you could expose a class method that takes a browser instance as a parameter to work with:

```es6
const fancyPlugin = require('puppeteer-extra-plugin-fancy')()
puppeteer.use(fancyPlugin)
const browser = await puppeteer.launch()
await fancyPlugin.killBrowser(browser)
```

*__example__*:
 ```js
async afterLaunch (browser, opts) {
  this.debug('browser has been launched', opts.options)
}
```

**Parameters:**

**browser: `Browser`**

The `puppeteer` browser instance.

**`Default value` opts: `object`**

| Name | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| options | `LaunchOptions` |  {} as Puppeteer.LaunchOptions |  Puppeteer launch options used. |

**Returns:** `Promise`<`void`>

___
<a id="beforeconnect"></a>

### `<Optional>` beforeConnect

▸ **beforeConnect**(options: *`ConnectOptions`*): `Promise`<`void`>

*Defined in plugin.ts:328*

Before connecting to an existing browser instance.

Can be used to modify the puppeteer connect options by modifying or returning them.

Plugins using this method will be called in sequence to each be able to update the launch options.

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| options | `ConnectOptions` |  Puppeteer connect options |

**Returns:** `Promise`<`void`>

___
<a id="beforelaunch"></a>

### `<Optional>` beforeLaunch

▸ **beforeLaunch**(options: *`any`*): `Promise`<`void`>

*Defined in plugin.ts:277*

Before a new browser instance is created/launched.

Can be used to modify the puppeteer launch options by modifying or returning them.

Plugins using this method will be called in sequence to each be able to update the launch options.

*__example__*:
 ```js
async beforeLaunch (options) {
  if (this.opts.flashPluginPath) {
    options.args.push(`--ppapi-flash-path=${this.opts.flashPluginPath}`)
  }
}
```

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| options | `any` |  Puppeteer launch options |

**Returns:** `Promise`<`void`>

___
<a id="getdatafromplugins"></a>

### `<Optional>` getDataFromPlugins

▸ **getDataFromPlugins**(name?: *`undefined` \| `string`*): [PluginData](../interfaces/plugindata.md)[]

*Defined in plugin.ts:476*

Helper method to retrieve `data` objects from other plugins.

A plugin needs to state the `dataFromPlugins` requirement in order to use this method. Will be mapped to `puppeteer.getPluginData`.

*__see__*: [data](puppeteerextraplugin.md#data)

*__see__*: [requirements](puppeteerextraplugin.md#requirements)

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| `Optional` name | `undefined` \| `string` |  Filter data by \`name\` property |

**Returns:** [PluginData](../interfaces/plugindata.md)[]

___
<a id="onbrowser"></a>

### `<Optional>` onBrowser

▸ **onBrowser**(browser: *`Browser`*, opts: *`any`*): `Promise`<`void`>

*Defined in plugin.ts:358*

Called when a browser instance is available.

This applies to both `puppeteer.launch()` and `puppeteer.connect()`.

Convenience method created for plugins that need access to a browser instance and don't mind if it has been created through `launch` or `connect`.

> Note: Don't assume that there will only be a single browser instance during the lifecycle of a plugin.

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| browser | `Browser` |  The \`puppeteer\` browser instance. |
| opts | `any` |

**Returns:** `Promise`<`void`>

___
<a id="onclose"></a>

### `<Optional>` onClose

▸ **onClose**(): `Promise`<`void`>

*Defined in plugin.ts:452*

**Deprecated:** Since puppeteer v1.6.0 `onDisconnected` has been improved and should be used instead of `onClose`.

In puppeteer < v1.6.0 `onDisconnected` was not catching all exit scenarios. In order for plugins to clean up properly (e.g. deleting temporary files) the `onClose` method had been introduced.

> Note: Might be called multiple times on exit.

> Note: This only includes browser instances created through `.launch()`.

**Returns:** `Promise`<`void`>

___
<a id="ondisconnected"></a>

### `<Optional>` onDisconnected

▸ **onDisconnected**(): `Promise`<`void`>

*Defined in plugin.ts:436*

Called when Puppeteer gets disconnected from the Chromium instance.

This might happen because of one of the following:

*   Chromium is closed or crashed
*   The `browser.disconnect` method was called

**Returns:** `Promise`<`void`>

___
<a id="onpagecreated"></a>

### `<Optional>` onPageCreated

▸ **onPageCreated**(page: *`Page`*): `Promise`<`void`>

*Defined in plugin.ts:399*

Same as `onTargetCreated` but prefiltered to only contain Pages, for convenience.

> Note: This includes page creations in incognito browser contexts.

> Note: This includes browser instances created through `.launch()` as well as `.connect()`.

*__example__*:
 ```js
async onPageCreated (page) {
  let ua = await page.browser().userAgent()
  if (this.opts.stripHeadless) {
    ua = ua.replace('HeadlessChrome/', 'Chrome/')
  }
  this.debug('new ua', ua)
  await page.setUserAgent(ua)
}
```

**Parameters:**

| Name | Type |
| ------ | ------ |
| page | `Page` |

**Returns:** `Promise`<`void`>

___
<a id="onpluginregistered"></a>

### `<Optional>` onPluginRegistered

▸ **onPluginRegistered**(): `Promise`<`void`>

*Defined in plugin.ts:461*

After the plugin has been registered in `puppeteer-extra`.

Normally right after `puppeteer.use(plugin)` is called

**Returns:** `Promise`<`void`>

___
<a id="ontargetchanged"></a>

### `<Optional>` onTargetChanged

▸ **onTargetChanged**(target: *`Target`*): `Promise`<`void`>

*Defined in plugin.ts:412*

Called when the url of a target changes.

> Note: This includes target changes in incognito browser contexts.

> Note: This includes browser instances created through `.launch()` as well as `.connect()`.

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| target | `Target` |   |

**Returns:** `Promise`<`void`>

___
<a id="ontargetcreated"></a>

### `<Optional>` onTargetCreated

▸ **onTargetCreated**(target: *`Target`*): `Promise`<`void`>

*Defined in plugin.ts:374*

Called when a target is created, for example when a new page is opened by window.open or browser.newPage.

> Note: This includes target creations in incognito browser contexts.

> Note: This includes browser instances created through `.launch()` as well as `.connect()`.

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| target | `Target` |   |

**Returns:** `Promise`<`void`>

___
<a id="ontargetdestroyed"></a>

### `<Optional>` onTargetDestroyed

▸ **onTargetDestroyed**(target: *`Target`*): `Promise`<`void`>

*Defined in plugin.ts:425*

Called when a target is destroyed, for example when a page is closed.

> Note: This includes target destructions in incognito browser contexts.

> Note: This includes browser instances created through `.launch()` as well as `.connect()`.

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| target | `Target` |   |

**Returns:** `Promise`<`void`>

___

