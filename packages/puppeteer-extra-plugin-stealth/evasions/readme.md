# puppeteer-extra-plugin-stealth/evasions

Various detection evasion plugins for `puppeteer-extra-plugin-stealth`.

You can bypass the main module and require specific evasion plugins yourself, if you wish to do so:

```es6
puppeteer.use(
  require('puppeteer-extra-plugin-stealth/evasions/console.debug')()
)
```

If you want to add a new evasion technique I suggest you look at the [template](./_template/) to kickstart things.
