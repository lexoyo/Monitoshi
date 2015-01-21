// imports
var events = require('events');
var http = require('http');
var util = require('util');

/**
 * monitor one URL
 * @class PingMonitor
 * @param {Object} config
 * @param {?number=} opt_timeout
 * @param {?number=} opt_interval
 */
module.exports = PingMonitor = function(config, opt_timeout, opt_interval) {
    /**
     * interval after which the website is polled again
     * may be specified in the main config object or in the monitor config
     * in ms
     * @type {number}
     * @default 10000
     */
    this.interval = config.interval || opt_interval || 10000;


    /**
     * timeout after which the website is considered to be down
     * in ms
     * @type {number}
     * @default 10000
     */
    this.timeout = config.timeout || opt_timeout || 10000;


    /**
     * name of the monitor
     * @type {string}
     */
    this.name = config.name;


    /**
     * url of the monitor
     * @type {string}
     */
    this.url = config.url;


    /**
     * id of the timer used for polling
     * @type {number|null}
     */
    this.timerId = null;


    // call super
    events.EventEmitter.call(this);
};

// inherit EventEmitter class
util.inherits(PingMonitor, events.EventEmitter);

/**
 * start the polling process
 */
PingMonitor.prototype.start = function() {
    this.timerId = setInterval(this.poll.bind(this), this.interval);
};


/**
 * stop the polling process
 */
PingMonitor.prototype.stop = function() {
    if(this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
    }
};


/**
 * poll one time
 */
PingMonitor.prototype.poll = function() {
    var hasTimedout = false;
    // do the request to get the website
    var req = http.get(this.url, function(res) {
        // notify the listeners
        if(res.statusCode === 200) {
            this.emit('success', res.statusCode);
        }
        else {
            this.emit('error', new Error('HTTPERROR', res.statusCode));
        }
    }.bind(this))
    .on('error', function(e) {
        // notify the listeners
        if(hasTimedout) {
            this.emit('error', new Error('TIMEOUT'));
            hasTimedout = false;
        }
        else {
            this.emit('error', e);
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

