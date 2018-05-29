# puppeteer-extra-plugin-stealth

Various detection evasion plugins for `puppeteer-extra-plugin-stealth`.

You can bypass the main module and require specific evasion plugins yourself, if you whish to do so:

```es6
puppeteer.use(require('puppeteer-extra-plugin-stealth/evasions/console.debug')())
```

If you want to add a new evasion technique I suggest you look at the [template](./evasions/_template) to kickstart things.
