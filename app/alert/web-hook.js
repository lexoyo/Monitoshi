// imports
var http = require('http');
var https = require('https');
var util = require('util');
var querystring = require('querystring');

/**
 * alerts to a given URL
 * @see https://zapier.com/
 * @see http://www.stashboard.org/
 * @see https://github.com/mrsinguyen/notify-webhook
 * @see http://ifttt.com
 * @class WebHookAlert
 * @param {{webHook:{url:string, method:string, params:string, post_options:Object}}} config
 */
module.exports = WebHookAlert = function(config) {
    /**
     * config
     * @type {Object}
     */
    this.config = config;
};


/**
 * send notification
 * @param {{subject:string, text:string}} event
 */
WebHookAlert.prototype.send = function(event) {
    console.log('WebHookAlert send', event, this.config.webHook);
    if(this.config.webHook) {
        const titleFieldName = this.config.webHook.titleFieldName || 'title';
        const detailsFieldName = this.config.webHook.detailsFieldName || 'details';
        let protocol = http;
        if (this.config.webHook['url'].indexOf('https') === 0) {
            protocol = https;
        }
        console.log('Send alert to webhook', this.config.webHook['url'], '(' + this.config.webHook['method'] + ')');
        if (this.config.webHook['method'] === 'get') {
            const url = `${this.config.webHook.url}?${this.config.webHook.params}&${titleFieldName}=${event.subject}&${detailsFieldName}=${event.text}`;
            const req = protocol.get(url, (res) => {
                console.log('alert sent done (', url, ') - status is: ', res.statusCode);
            });
        }
        else {
            var query = {};
            query[titleFieldName] = event.subject;
            query[detailsFieldName] = event.text;
            var postData = querystring.stringify(query);
            var post_options = this.config.webHook['post_options'];
            post_options.headers['Content-Length'] = postData.length;

            // Set up the request
            // FIXME: handle errors (it crashes the app for now)
            var post_req = protocol.request(post_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    console.log('webhook alert sent done - response is: ' + chunk);
                });
            });
            // post the data
            post_req.write(postData);
            post_req.end();
        }
    }
};
