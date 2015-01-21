// imports
var http = require('http');
var https = require('https');
var util = require('util');

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
    var url = util.format(this.config.url + '?' + this.config.params, status, message);
    console.log('alert sent', url);
    var protocol = http;
    if (this.config.url.indexOf('https') === 0) {
        protocol = https;
    }
    var req = protocol.get(url, function(res) {
        console.log('alert sent done', res.statusCode);
    }.bind(this));

};
