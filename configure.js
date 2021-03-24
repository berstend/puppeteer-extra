const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");

const argv = process.argv.filter(a=> a.match(/^[0-9.]+$/));
if  (argv.length != 1) {
    console.error('please provide puppeter version ex:');
    console.error('- 8.0.0 # Chromium 90.0.4427.0, Feb 18, 2021');
    console.error('- 7.0.0 # Chromium 90.0.4403.0, Feb 3, 2021');
    console.error('- 5.0.0 # Chromium 83.0.4103.0, Jul 2, 2020');
    console.error('- 2.1.1 # Chromium 79.0.3942.0, Oct 24 2019');
    console.error('- 2.0.0 # Chromium 79.0.3942.0, Oct 24 2019');
    console.error('- 1.20.0 # Chromium 78.0.3882.0, Sep 13 2019');
    console.error('- 1.15.0 # Chromium 75.0.3765.0, Apr 26 2019');
    console.error('- 1.9.0 # Chromium 71.0.3563.0, Oct 4, 2018');
    console.error('- 1.6.2 # Chromium 69.0.3494.0, Aug 1, 2018');
    process.exit(1);
}

const version = argv[0];
const major = Number(version.replace(/\..+/, ''));
const platform = os.platform();

function display(error, stdout, stderr) {
    if (error) {
        console.error(`${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`${stderr}`);
        return;
    }
    console.log(`${stdout}`);
}

console.log(`Calling yarn`);
exec(`yarn`, display);

if (platform === 'darwin' || platform === 'freebsd' || platform === 'freebsd') {
    console.log(`OS: ${platform}, enabling fsevents`);
    exec(`npx json -I -f package.json -e 'this.resolutions={"**/fsevents": "^2.1.2"}'`, display);
} else {
    console.log(`OS: ${platform}, diabling fsevents`);
    exec(`npx json -I -f package.json -e 'this.resolutions={}'`, display);
}

const tsDir = path.join('packages', 'puppeteer-extra', 'src');
if (major >= 8) {
    console.log('change @cliqz/adblocker-puppeteer version to 1.20.3');
    exec(`npx json -I -f package.json -e 'this.dependencies.@cliqz/adblocker-puppeteer=1.20.3'`, display);
    fs.copyFileSync(path.join(tsDir, 'puppeteer.ts.new'), path.join(tsDir, 'puppeteer.ts'))
    exec(`yarn lerna exec 'yarn remove @types/puppeteer || true'`, display);
} else {
    console.log('change @cliqz/adblocker-puppeteer version to 1.19');
    exec(`npx json -I -f package.json -e 'this.dependencies.@cliqz/adblocker-puppeteer=1.19'`, display);
    fs.copyFileSync(path.join(tsDir, 'puppeteer.ts.legacy'), path.join(tsDir, 'puppeteer.ts'))
    console.log(`installing @types/puppeteer Done`);
    exec(`yarn lerna add --dev @types/puppeteer`, display);
}
console.log(`installing puppeteer@${version}`);
exec(`yarn lerna add --dev puppeteer@${version}`, display);
console.log(`installing puppeteer@${version} Done`);
