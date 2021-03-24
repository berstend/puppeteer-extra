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

exec(`yarn add lerna --ignore-workspace-root-check --dev`, display);

// console.log(`Calling yarn`);
// exec(`yarn`, display);

if (platform === 'darwin' || platform === 'freebsd' || platform === 'freebsd') {
    console.log(`OS: ${platform}, enabling fsevents`);
    exec(`npx json -I -f package.json -e 'this.resolutions={"**/fsevents": "^2.1.2"}'`, display);
} else {
    console.log(`OS: ${platform}, diabling fsevents`);
    exec(`npx json -I -f package.json -e 'this.resolutions={}'`, display);
}

const tsDir = path.join('packages', 'puppeteer-extra', 'src');
// const adblockerPath = path.join('packages', 'puppeteer-extra-plugin-adblocker')
const adblockerPathFull = path.resolve('packages', 'puppeteer-extra-plugin-adblocker')


let cliqz = '';
let mode = '';
if (major >= 8) {
    cliqz = '1.20.3';
    mode = 'new';
    console.log(`removing old @types/puppeteer`);
    // exec(`yarn lerna exec 'yarn remove @types/puppeteer || true'`, display);
    const modules = fs.readdirSync('packages');
    for (const module of modules) {
        exec(`yarn remove @types/puppeteer`, {cwd: path.resolve('packages', module)});
    }
} else {
    cliqz = '1.19';
    mode = 'legacy';
    console.log(`installing @types/puppeteer`);
    exec(`yarn lerna add --dev @types/puppeteer`, display);
}
fs.copyFileSync(path.join(tsDir, `puppeteer.ts.${mode}`), path.join(tsDir, 'puppeteer.ts'))

console.log(`change @cliqz/adblocker-puppeteer version to ${cliqz}`);
exec(`yarn add @cliqz/adblocker-puppeteer@${cliqz}`, {cwd: adblockerPathFull}, display);

console.log(`installing puppeteer@${version}`);
exec(`yarn lerna add --dev puppeteer@${version}`, display);
console.log(`installing puppeteer@${version} Done`);
