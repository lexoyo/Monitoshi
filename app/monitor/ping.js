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
 * @param {?number=} opt_attempts number of attempts before an URL is considered down, default is 3
 */
module.exports = PingMonitor = function(opt_timeout, opt_interval, opt_attempts) {
    /**
     * interval after which the website is polled again
     * may be specified in the main config object or in the monitor config
     * in ms
     * @type {number}
     * @default 10000
     */
    this.interval = opt_interval || 10000;


    /**
     * timeout after which the website is considered to be down
     * in ms
     * @type {number}
     * @default 10000
     */
    this.timeout = opt_timeout || 10000;


    /**
     * number of attempts before an URL is considered down
     * @type {number}
     * @default 3
     */
    this.attempts = opt_attempts || 3;


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
PingMonitor.prototype.poll = function(url, opt_failed) {
    var hasTimedout = false;
    var failed = opt_failed || 0;
    // handle https as well as http
    var service = url.indexOf('https') === 0 ? https : http;
    // do the request to get the website
    var req = service.get(url, function(res) {
        // abort, otherwise it emmits a socket timeout after the timeout is elapsed
        req.abort();
        // notify the listeners
        if(res.statusCode === 200) {
            this.emit('success', res.statusCode);
        }
        else {
            if(++failed >= this.attempts) {
                this.emit('error', new Error('HTTPERROR', res.statusCode));
            }
            else {
                this.poll(url, failed);
            }
        }
    }.bind(this))
    .on('error', function(e) {
        // just in case, to prevent fireing timeout
        req.abort();
        if(++failed >= this.attempts) {
            // notify the listeners
            var error = e;
            if(hasTimedout === true) {
                hasTimedout = false;
                error = new Error('TIMEOUT');
            }
            this.emit('error', error);
        }
        else {
            // Wait a bit before polling it again
            setTimeout(function(){
              this.poll(url, failed);
            }.bind(this), 500);
        }
    }.bind(this))
    .on('socket', function (socket) {
        socket.setTimeout(this.timeout);
        socket.on('timeout', function() {
            hasTimedout = true;
            req.abort();
        }.bind(this));
    }.bind(this));
};
