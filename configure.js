const chalk = require('chalk');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require("child_process");

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

function prntLog(text, status) {
    console.log(chalk.greenBright(text), chalk.yellow(status));
    if (status === 'Done')
        console.log();
}


prntLog(`Installing lerna 4`, `Start`);
execSync(`yarn add lerna@^4.0.0 --ignore-workspace-root-check --dev`, display);
prntLog(`Installing lerna 4`, `Done`);

// console.log(`Calling yarn`);
// execSync(`yarn`, display);

prntLog(`configuring fsevents`, `Start`);
if (platform === 'darwin' || platform === 'freebsd' || platform === 'freebsd') {
    console.log(`OS: ${platform}, enabling fsevents`);
    execSync(`npx json -I -f package.json -e 'this.resolutions={"**/fsevents": "^2.1.2"}'`, {encoding: 'utf-8'}, display);
} else {
    console.log(`OS: ${platform}, diabling fsevents`);
    execSync(`npx json -I -f package.json -e 'this.resolutions={}'`, {encoding: 'utf-8'}, display);
}
prntLog(`configuring fsevents`, `Done`);

const tsDir = path.join('packages', 'puppeteer-extra', 'src');
const adblockerPathFull = path.resolve('packages', 'puppeteer-extra-plugin-adblocker')

let cliqz = '';
let mode = '';
if (major >= 8) {
    cliqz = '1.20.3';
    mode = 'new';
    prntLog(`removing old @types/puppeteer`, `Start`);
    const modules = fs.readdirSync('packages');
    for (const module of modules) {
        try {
        execSync(`yarn remove @types/puppeteer`, {cwd: path.resolve('packages', module), encoding: 'utf-8'});
        } catch (e) {}
    }
    prntLog(`removing old @types/puppeteer`, `Done`);
} else {
    cliqz = '1.19';
    mode = 'legacy';
    prntLog(`installing @types/puppeteer`, `Start`);
    execSync(`yarn lerna add --dev @types/puppeteer`, {encoding: 'utf-8'}, display);
    prntLog(`installing @types/puppeteer`, `Done`);
}

prntLog(`activating puppeteer.ts${mode}`, `Start`);
fs.copyFileSync(path.join(tsDir, `puppeteer.ts.${mode}`), path.join(tsDir, 'puppeteer.ts'))
prntLog(`activating puppeteer.ts${mode}`, `Done`);

prntLog(`Change @cliqz/adblocker-puppeteer version to ${cliqz}`, `Start`);
execSync(`yarn add @cliqz/adblocker-puppeteer@${cliqz}`, {cwd: adblockerPathFull, encoding: 'utf-8'}, display);
prntLog(`Change @cliqz/adblocker-puppeteer version to ${cliqz}`, `Done`);

prntLog(`installing puppeteer@${version}`, `Start`);
execSync(`yarn lerna add --dev puppeteer@${version}`, {encoding: 'utf-8'}, display);
prntLog(`installing puppeteer@${version}`, `Done`);
