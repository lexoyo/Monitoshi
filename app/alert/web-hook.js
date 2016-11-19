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
    if(this.config.webHook) {
        console.log('send WebHook', event.email, event.subject);
        const titleFieldName = this.config.webHook.titleFieldName || 'title';
        const detailsFieldName = this.config.webHook.detailsFieldName || 'details';
        const urlFieldName = this.config.webHook.urlFieldName || 'url';
        const emailFieldName = this.config.webHook.emailFieldName || 'email';
        let protocol = http;
        if (this.config.webHook['url'].indexOf('https') === 0) {
            protocol = https;
        }
        if (this.config.webHook['method'] === 'get') {
            const url = `${this.config.webHook.url}?${this.config.webHook.params}&${titleFieldName}=${event.subject}&${detailsFieldName}=${event.text}&${urlFieldName}=${event.url}&${emailFieldName}=${event.email}`;
            const req = protocol.get(url, (res) => {});
        }
        else {
            var query = {};
            query[titleFieldName] = event.subject;
            query[detailsFieldName] = event.text;
            query[urlFieldName] = event.url;
            query[emailFieldName] = event.email;
            var postData = querystring.stringify(query);
            var post_options = this.config.webHook['post_options'];
            post_options.headers['Content-Length'] = postData.length;

            // Set up the request
            // FIXME: handle errors (it crashes the app for now)
            var post_req = protocol.request(post_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {});
            });
            // post the data
            post_req.write(postData);
            post_req.end();
        }
    }
};
