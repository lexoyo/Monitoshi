// imports
var events = require('events');
var http = require('http');
var util = require('util');

/**
 * monitor one URL
 * @class PingMonitor
 * @param {Object} config object containing other config elements (name, url)
 * @param {?number=} opt_timeout  timeout after which the website is considered to be down (ms), default is 1000
 * @param {?number=} opt_interval interval after which the website is polled again (ms), default is 1000
 * @param {?number=} opt_attempts number of attempts before an URL is considered down, default is 3
 */
module.exports = PingMonitor = function(config, opt_timeout, opt_interval, opt_attempts) {
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
     * number of attempts before an URL is considered down
     * @type {number}
     * @default 3
     */
    this.attempts = config.attempts || opt_attempts || 3;


    /**
     * number of attempts already made and the URL was down
     * @type {number}
     */
    this.failed = 0;


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


    /**
     * state of the monitoring
     * used to dispatch up/down events only when state changes
     * @type {PingMonitor.State}
     */
    this.state = PingMonitor.State.UP;


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
            if (this.state === PingMonitor.State.DOWN) {
                this.emit('success', res.statusCode);
            }
            this.state = PingMonitor.State.UP;
            this.failed = 0;
        }
        else {
            if(++this.failed >= this.attempts) {
                if (this.state === PingMonitor.State.UP) {
                    this.emit('error', new Error('HTTPERROR', res.statusCode));
                }
                this.state = PingMonitor.State.DOWN;
            }
        }
        // abort, otherwise it emmits a socket timeout after the timeout is elapsed
        req.abort();
    }.bind(this))
    .on('error', function(e) {
        if(++this.failed >= this.attempts) {
            if (this.state === PingMonitor.State.UP) {
                // notify the listeners
                var error = e;
                if(hasTimedout === true) {
                    hasTimedout = false;
                    error = new Error('TIMEOUT');
                }
                this.emit('error', error);
            }
            this.state = PingMonitor.State.DOWN;
        }
        // just in case, to prevent fireing timeout
        req.abort();
    }.bind(this))
    .on('socket', function (socket) {
        socket.setTimeout(this.timeout);
        socket.on('timeout', function() {
            hasTimedout = true;
            req.abort();
        }.bind(this));
    }.bind(this));
};


/**
 * State of the monitor
 * @enum
 */
PingMonitor.State = {
    DOWN: 0,
    UP: 1
}
