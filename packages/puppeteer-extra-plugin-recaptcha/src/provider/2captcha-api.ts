// https://github.com/bochkarev-artem/2captcha/blob/master/index.js
// TODO: Create our own API wrapper

var http = require('http')
var https = require('https')
var url = require('url')
var querystring = require('querystring')

var apiKey
var apiInUrl = 'http://2captcha.com/in.php'
var apiResUrl = 'http://2captcha.com/res.php'
var apiMethod = 'base64'
var apiMethodRecaptcha = 'userrecaptcha'
var SOFT_ID = '2589'

var defaultOptions = {
  pollingInterval: 2000,
  retries: 3
}

function pollCaptcha(captchaId, options, invalid, callback) {
  invalid = invalid.bind({ options: options, captchaId: captchaId })
  var intervalId = setInterval(function() {
    var httpRequestOptions = url.parse(
      apiResUrl +
        '?action=get&soft_id=' +
        SOFT_ID +
        '&key=' +
        apiKey +
        '&id=' +
        captchaId
    )
    var request = http.request(httpRequestOptions, function(response) {
      var body = ''

      response.on('data', function(chunk) {
        body += chunk
      })

      response.on('end', function() {
        if (body === 'CAPCHA_NOT_READY') {
          return
        }

        clearInterval(intervalId)

        var result = body.split('|')
        if (result[0] !== 'OK') {
          callback(result[0]) //error
        } else {
          callback(
            null,
            {
              id: captchaId,
              text: result[1]
            },
            invalid
          )
        }
        callback = function() {} // prevent the callback from being called more than once, if multiple http requests are open at the same time.
      })
    })

    request.end()
  }, options.pollingInterval || defaultOptions.pollingInterval)
}

export const setApiKey = function(key) {
  apiKey = key
}

export const decode = function(base64, options, callback) {
  if (!callback) {
    callback = options
    options = defaultOptions
  }
  var httpRequestOptions = url.parse(apiInUrl)
  httpRequestOptions.method = 'POST'

  var postData = {
    method: apiMethod,
    key: apiKey,
    soft_id: SOFT_ID,
    body: base64
  }

  postData = querystring.stringify(postData)

  var request = http.request(httpRequestOptions, function(response) {
    var body = ''

    response.on('data', function(chunk) {
      body += chunk
    })

    response.on('end', function() {
      var result = body.split('|')
      if (result[0] !== 'OK') {
        return callback(result[0])
      }

      pollCaptcha(
        result[1],
        options,
        function(error) {
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
            decode(base64, this.options, callback)
          } else {
            callbackToInitialCallback('CAPTCHA_FAILED_TOO_MANY_TIMES')
          }
        },
        callback
      )
    })
  })
  request.write(postData)
  request.end()
}

export const decodeReCaptcha = function(captcha, pageUrl, options, callback) {
  if (!callback) {
    callback = options
    options = defaultOptions
  }
  var httpRequestOptions = url.parse(apiInUrl)
  httpRequestOptions.method = 'POST'

  var postData = {
    method: apiMethodRecaptcha,
    key: apiKey,
    soft_id: SOFT_ID,
    googlekey: captcha,
    pageurl: pageUrl
  }

  postData = querystring.stringify(postData)

  var request = http.request(httpRequestOptions, function(response) {
    var body = ''

    response.on('data', function(chunk) {
      body += chunk
    })

    response.on('end', function() {
      var result = body.split('|')
      if (result[0] !== 'OK') {
        return callback(result[0])
      }

      pollCaptcha(
        result[1],
        options,
        function(error) {
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
            decode(captcha, this.options, callback)
          } else {
            callbackToInitialCallback('CAPTCHA_FAILED_TOO_MANY_TIMES')
          }
        },
        callback
      )
    })
  })
  request.write(postData)
  request.end()
}

export const decodeUrl = function(uri, options, callback) {
  if (!callback) {
    callback = options
    options = defaultOptions
  }
  var protocol = http
  if (uri.indexOf('https') == 0) protocol = https

  var options = url.parse(uri)

  var request = protocol.request(options, function(response) {
    var body = ''
    response.setEncoding('base64')

    response.on('data', function(chunk) {
      body += chunk
    })

    response.on('end', function() {
      decode(body, options, callback)
    })
  })
  request.end()
}

export const solveRecaptchaFromHtml = function(html, options, callback) {
  if (!callback) {
    callback = options
    options = defaultOptions
  }
  var googleUrl = html.split('/challenge?k=')
  if (googleUrl.length < 2) return callback('No captcha found in html')
  googleUrl = googleUrl[1]
  googleUrl = googleUrl.split('"')[0]
  googleUrl = googleUrl.split("'")[0]
  googleUrl = 'https://www.google.com/recaptcha/api/challenge?k=' + googleUrl

  var protocol = http
  if (googleUrl.indexOf('https') == 0) protocol = https

  var httpRequestOptions = url.parse(googleUrl)

  var request = protocol.request(httpRequestOptions, function(response) {
    var body = ''
    response.on('data', function(chunk) {
      body += chunk
    })

    response.on('end', function() {
      var challengeArr = body.split("'")
      if (!challengeArr[1]) return callback('Parsing captcha failed')
      var challenge = challengeArr[1]
      if (challenge.length === 0) return callback('Parsing captcha failed')

      decodeUrl(
        'https://www.google.com/recaptcha/api/image?c=' + challenge,
        options,
        function(error, result, invalid) {
          if (result) {
            result.challenge = challenge
          }
          callback(error, result, invalid)
        }
      )
    })
  })
  request.end()
}

export const report = function(captchaId) {
  var reportUrl =
    apiResUrl +
    '?action=reportbad&soft_id=' +
    SOFT_ID +
    '&key=' +
    apiKey +
    '&id=' +
    captchaId
  var options = url.parse(reportUrl)

  var request = http.request(options, function(response) {
    // var body = ''
    // response.on('data', function(chunk) {
    //   body += chunk
    // })
    // response.on('end', function() {})
  })
  request.end()
}
