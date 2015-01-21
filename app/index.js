var express    = require('express');
var app = module.exports = express();

// config
var fs = require('fs');
var configFile = process.env.MT_CONFIG_FILE || __dirname + '/../sample-config.js';
var config = require(configFile);
app.set('config', config);
console.info('***********************************');
console.info('Monitoshi starting with', config.monitors.length, 'monitors.');

/*
// API
app.get('/isup/:idx', require('./routes/isup.js'));
if (!module.parent) {
  var port = process.env.PORT || 7070;
  app.listen(port, function() {
    console.log('Listening on ' + port);
  });
}
*/

// browse monitors from config
var PingMonitor = require('./monitor/ping');
config.monitors.forEach(function(monitorConfig) {
    if (monitorConfig.enabled !== false) {
        console.log('creating monitor:', monitorConfig.name, monitorConfig.type);
        // create the monitor with this config
        var monitor = null;
        switch(monitorConfig.type) {
            case 'ping':
            default:
                monitor = new PingMonitor(monitorConfig, config.timeout, config.interval);
            break;
        }
        monitor
            .on('success', function(statusCode) {
                console.log('Monitor',  monitorConfig.name, monitorConfig.type, 'is up', statusCode);
            })
            .on('error', function(err) {
                console.error('Monitor',  monitorConfig.name, monitorConfig.type, 'is down -', err);
            });
        monitor.start();
    }
});