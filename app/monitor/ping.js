// imports
var events = require('events');
var http = require('http');
var https = require('https');
var util = require('util');

/**
 * monitor one URL
 * @class PingMonitor
 * @param {Object} config object containing other config elements (name, url)
 * @param {?number=} opt_timeout  timeout after which the website is considered to be down (ms), default is 1000
 * @param {?number=} opt_interval interval after which the website is polled again (ms), default is 1000
 */
module.exports = PingMonitor = function(opt_timeout, opt_interval) {

    /**
     * timeout after which the website is considered to be down
     * in ms
     * @type {number}
     * @default 10000
     */
    this.timeout = opt_timeout || 10000;

    // call super
    events.EventEmitter.call(this);
};

// inherit EventEmitter class
util.inherits(PingMonitor, events.EventEmitter);


/**
 * poll one time
 * @param {string} url
 * @param {boolean} isUp
 */
PingMonitor.prototype.poll = function(url) {
    var hasTimedout = false;
    // handle https as well as http
    // FIXME: better use https://www.npmjs.com/package/request
    var service = url.indexOf('https') === 0 ? https : http;
    try {
        // do the request to get the website
        var req = service.get(url, function(res) {
            // abort, otherwise it emmits a socket timeout after the timeout is elapsed
            req.abort();
            // notify the listeners
            if(res.statusCode === 200) {
                this.emit('success', res.statusCode);
            }
            else {
                this.emit('error', new Error('HTTPERROR', res.statusCode));
            }
        }.bind(this))
        .on('error', function(e) {
            // just in case, to prevent fireing timeout
            req.abort();
            // notify the listeners
            var error = e;
            if(hasTimedout === true) {
                hasTimedout = false;
                error = new Error('TIMEOUT');
            }
            this.emit('error', error);
        }.bind(this))
        .on('socket', function (socket) {
            socket.setTimeout(this.timeout);
            socket.on('timeout', function() {
                hasTimedout = true;
                req.abort();
            }.bind(this));
        }.bind(this));
    }
    catch(e) {
        // this happens when url is like https:www.abcdefgh.com.br/
        console.error('Poll Error', url, e);
    }
};
