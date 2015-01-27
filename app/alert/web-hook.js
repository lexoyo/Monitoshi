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
 * @param {string} title
 * @param {string} details
 */
WebHookAlert.prototype.send = function(title, details, detailsNoHtml) {
    var protocol = http;
    if (this.config['url'].indexOf('https') === 0) {
        protocol = https;
    }
    console.log('Send alert to webhook', this.config['url'], '(' + this.config['method'] + ')');
    if (this.config['method'] === 'get') {
        var url = util.format(this.config['url'] + '?' + this.config['params'], title, details, detailsNoHtml);
        var req = protocol.get(url, function(res) {
            console.log('alert sent done - status is: ', res.statusCode);
        }.bind(this));
    }
    else {
        var postData = querystring.stringify({
            'title': title,
            'details': details,
            'details_no_html': detailsNoHtml
        });
        var post_options = this.config['post_options'];
        post_options.headers['Content-Length'] = postData.length;

        // Set up the request
        var post_req = protocol.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('alert sent done - response is: ' + chunk);
            });
        });
        // post the data
        post_req.write(postData);
        post_req.end();
    }
};
