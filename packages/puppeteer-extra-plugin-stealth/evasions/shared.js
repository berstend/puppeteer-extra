/** This could be further improved still (use Proxy and mock behaviour of functions and their errors) */
const getChromeRuntimeMock = window => {
  const installer = { install() {} }
  return {
    app: {
      isInstalled: false,
      InstallState: {
        DISABLED: 'disabled',
        INSTALLED: 'installed',
        NOT_INSTALLED: 'not_installed'
      },
      RunningState: {
        CANNOT_RUN: 'cannot_run',
        READY_TO_RUN: 'ready_to_run',
        RUNNING: 'running'
      }
    },
    csi() {},
    loadTimes() {},
    webstore: {
      onInstallStageChanged: {},
      onDownloadProgress: {},
      install(url, onSuccess, onFailure) {
        installer.install(url, onSuccess, onFailure)
      }
    },
    runtime: {
      OnInstalledReason: {
        CHROME_UPDATE: 'chrome_update',
        INSTALL: 'install',
        SHARED_MODULE_UPDATE: 'shared_module_update',
        UPDATE: 'update'
      },
      OnRestartRequiredReason: {
        APP_UPDATE: 'app_update',
        OS_UPDATE: 'os_update',
        PERIODIC: 'periodic'
      },
      PlatformArch: {
        ARM: 'arm',
        MIPS: 'mips',
        MIPS64: 'mips64',
        X86_32: 'x86-32',
        X86_64: 'x86-64'
      },
      PlatformNaclArch: {
        ARM: 'arm',
        MIPS: 'mips',
        MIPS64: 'mips64',
        X86_32: 'x86-32',
        X86_64: 'x86-64'
      },
      PlatformOs: {
        ANDROID: 'android',
        CROS: 'cros',
        LINUX: 'linux',
        MAC: 'mac',
        OPENBSD: 'openbsd',
        WIN: 'win'
      },
      RequestUpdateCheckStatus: {
        NO_UPDATE: 'no_update',
        THROTTLED: 'throttled',
        UPDATE_AVAILABLE: 'update_available'
      },
      connect: function() {}.bind(function() {}), // eslint-disable-line
      sendMessage: function() {}.bind(function() {}) // eslint-disable-line
    }
  }
}

module.exports = {
  getChromeRuntimeMock
}
