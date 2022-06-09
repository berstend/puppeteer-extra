/* eslint-disable */
// imported from: https://intoli.com/blog/not-possible-to-block-chrome-headless/chrome-headless-test.js
// imported date: 2022-06-09
// User-Agent Test
const userAgentElement = document.getElementById('user-agent-result');
userAgentElement.innerHTML = navigator.userAgent;
if (/HeadlessChrome/.test(navigator.userAgent)) {
  userAgentElement.classList.add('failed');
  userAgentElement.classList.remove('passed');
} else {
  userAgentElement.classList.add('passed');
  userAgentElement.classList.remove('failed');
}

// Webdriver Test
const webdriverElement = document.getElementById('webdriver-result');
if (navigator.webdriver) {
  webdriverElement.classList.add('failed');
  webdriverElement.classList.remove('passed');
  webdriverElement.innerHTML = 'present (failed)';
} else {
  webdriverElement.classList.add('passed');
  webdriverElement.classList.remove('failed');
  webdriverElement.innerHTML = 'missing (passed)';
}

// Chrome Test
const chromeElement = document.getElementById('chrome-result');
if (!window.chrome) {
  chromeElement.classList.add('failed');
  chromeElement.classList.remove('passed');
  chromeElement.innerHTML = 'missing (failed)';
} else {
  chromeElement.classList.add('passed');
  chromeElement.classList.remove('failed');
  chromeElement.innerHTML = 'present (passed)';
}

// Permissions Test
const permissionsElement = document.getElementById('permissions-result');
(async () => {
  const permissionStatus = await navigator.permissions.query({ name: 'notifications' });
  permissionsElement.innerHTML = permissionStatus.state;
  if(Notification.permission === 'denied' && permissionStatus.state === 'prompt') {
    permissionsElement.classList.add('failed');
    permissionsElement.classList.remove('passed');
  } else {
    permissionsElement.classList.add('passed');
    permissionsElement.classList.remove('failed');
  }
})();

// Plugins Length Test
const pluginsLengthElement = document.getElementById('plugins-length-result');
pluginsLengthElement.innerHTML = navigator.plugins.length;
if (navigator.plugins.length === 0) {
  pluginsLengthElement.classList.add('failed');
  pluginsLengthElement.classList.remove('passed');
} else {
  pluginsLengthElement.classList.add('passed');
  pluginsLengthElement.classList.remove('failed');
}

// Languages Test
const languagesElement = document.getElementById('languages-result');
languagesElement.innerHTML = navigator.languages;
if (!navigator.languages || navigator.languages.length === 0) {
  languagesElement.classList.add('failed');
  languagesElement.classList.remove('passed');
} else {
  languagesElement.classList.add('passed');
  languagesElement.classList.remove('failed');
}