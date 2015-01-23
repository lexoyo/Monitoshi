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
 * @class WebHookAlert
 * @param {Object} config
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
 */
WebHookAlert.prototype.send = function(status, message) {
    var protocol = http;
    if (this.config.url.indexOf('https') === 0) {
        protocol = https;
    }
    if (this.config.method === 'get') {
        var url = util.format(this.config.url + '?' + this.config.params, status, message);
        console.log('alert sent', url);
        var req = protocol.get(url, function(res) {
            console.log('alert sent done', res.statusCode);
        }.bind(this));
    }
    else {
        var post_data = querystring.stringify({
            status: status,
            message: message,
        });
        var post_options = this.config.post_options;
        post_options.headers['Content-Length'] = post_data.length;
        console.log('alert sent', post_data, post_options);

        // Set up the request
        var post_req = protocol.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('alert post Response: ' + chunk);
            });
        });
        // post the data
        post_req.write(post_data);
        post_req.end();
    }
};
