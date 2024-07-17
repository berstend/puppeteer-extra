// TODO: Create our own API wrapper

var https = require('https')
var url = require('url')

var apiKey
var apiUrl = 'https://api.capmonster.cloud'
var apiInUrl = 'http://api.capmonster.cloud/in.php'
//var apigetTaskUrl = 'https://api.capmonster.cloud/getTaskResult'
// var apiMethod = 'base64'
// var SOFT_ID = '2589'

var defaultOptions = {
  pollingInterval: 40000,
  retries: 4,
}

function pollCaptcha(captchaId, options, invalid, callback) {
  invalid = invalid.bind({ options: options, captchaId: captchaId })
  var intervalId = setInterval(function () {
    // var httpsRequestOptions = url.parse(
    //   apiResUrl +
    //     '?action=get&soft_id=' +
    //     SOFT_ID +
    //     '&key=' +
    //     apiKey +
    //     '&id=' +
    //     captchaId
    // )

    var httpsRequestOptions = {
      method: 'POST',
      hostname: apiUrl,
      path: '/getTaskResult',
      headers: {
        clientKey: apiKey,
        taskId: captchaId,
        nocache: 1,
      },
    }
    var request = https.request(httpsRequestOptions, function (response) {
      var body = ''

      response.on('data', function (chunk) {
        body += chunk
      })

      response.on('end', function () {
        const res = JSON.parse(body)
        if (res.status === 'processing') {
          return
        }

        clearInterval(intervalId)

        //  var result = body // .split('|')
        if (res.status !== 'ready') {
          callback(res) // error
        } else {
          callback(
            null,
            {
              id: captchaId,
              text: res.solution.gRecaptchaResponse,
            },
            invalid
          )
        }
        callback = function () {} // prevent the callback from being called more than once, if multiple https requests are open at the same time.
      })
    })
    request.on('error', function (e) {
      request.destroy()
      callback(e)
    })
    request.end()
  }, options.pollingInterval || defaultOptions.pollingInterval)
}

export const setApiKey = function (key) {
  apiKey = key
}

export const decodeReCaptcha = function (
  captchaMethod,
  captcha,
  pageUrl,
  extraData,
  options,
  callback
) {
  if (!callback) {
    callback = options
    options = defaultOptions
  }
  var httpsRequestOptions = url.parse(apiInUrl)
  httpsRequestOptions.method = 'POST'

  var postData = {
    key: apiKey,
    method: captchaMethod,
    pageURL: pageUrl,
    ...extraData,
  }
  if (captchaMethod === 'userrecaptcha') {
    postData.googlekey = captcha
  }
  if (captchaMethod === 'hcaptcha') {
    postData.sitekey = captcha
  }
  postData.nocache = 1

  var request = https.request(httpsRequestOptions, function (response) {
    var body = ''

    response.on('data', function (chunk) {
      body += chunk
    })

    response.on('end', function () {
      var result = JSON.parse(body)
      if (result.errorId !== 0) {
        return callback(result.errorCode)
      }

      pollCaptcha(
        result.taskId,
        options,
        function (error) {
          var callbackToInitialCallback = callback

          report(this.captchaId)

          if (error) {
            return callbackToInitialCallback('CAPTCHA_FAILED')
          }

          if (!this.options.retries) {
            this.options.retries = defaultOptions.retries
          }
          if (this.options.retries > 1) {
            this.options.retries = this.options.retries - 1
            decodeReCaptcha(
              captchaMethod,
              captcha,
              pageUrl,
              extraData,
              this.options,
              callback
            )
          } else {
            callbackToInitialCallback('CAPTCHA_FAILED_TOO_MANY_TIMES')
          }
        },
        callback
      )
    })
  })
  request.on('error', function (e) {
    request.destroy()
    callback(e)
  })
  request.write(postData)
  request.end()
}

export const report = function (captchaId) {
  var reportUrl =
    apiInUrl +
    '?action=reportbad&soft_id=' +
    '&key=' +
    apiKey +
    '&id=' +
    captchaId
  var options = url.parse(reportUrl)

  var request = https.request(options, function (response) {
    // var body = ''
    // response.on('data', function(chunk) {
    //   body += chunk
    // })
    // response.on('end', function() {})
  })
  request.end()
}
