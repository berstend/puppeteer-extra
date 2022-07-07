---
name: Bug report
about: Create a bug report
title: '[Bug] '
labels: 'issue: bug report, needs triage'
---

<!--
  Thanks for filing an issue!
  Kindly search the issue tracker before posting a new issue.

  Due to bad experiences we have to unfortunately mention it:
  - Be respectful with our time, this is an open-source project run by volunteers in their free time.
  - Don't come across as entitled, unfriendly or angry or nobody will help you (general rule in life).
  - Reporting a "bug" without ways to reproduce it is not "contributing to open-source".

  - NOTE: "SiteA.com stopped working" is not a valid stealth-plugin bug report, unless used
    as an example to show a technical issue while providing specific example code of the problem.
    For general purpose usage discussions please use the community discord: https://extra.community
-->

**Describe the bug**

<!--
  - What you were trying to accomplish when the bug occurred
  - A description of what you expected and what actually happened
  - How to reproduce the issue
-->

**Code Snippet**

<!--
  Help us help you! Put down a short code snippet that illustrates your bug and
  that we can run and debug locally. If possible remove everything
  that is not related and make it as short as possible. For example:
-->

```javascript
const puppeteer = require('puppeteer-extra')

;(async () => {
  const browser = await puppeteer.launch()
  // ...
})()
```

**Versions**

<!--
Run the following command in your project directory, and paste its results here:

npx envinfo@latest --system --binaries --npmPackages '*(puppeteer*|playwright*|automation-extra*|@extra*)'
-->
