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

// build the alerts from config
var WebHookAlert = require('./alert/web-hook');
var alerts = [];
config.alerts.forEach(function(alertConfig) {
    if (alertConfig.enabled !== false) {
        console.log('creating alert:', alertConfig.name, alertConfig.type);
        // create the monitor with this config
        var alert = null;
        switch(alertConfig.type) {
            case 'webhook':
            default:
                alert = new WebHookAlert(alertConfig);
            break;
        }
        alerts[alertConfig.name] = alert;
    }
});

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
                if(monitorConfig.alerts) {
                    monitorConfig.alerts.forEach(function(alertId) {
                        console.log('alert', alertId, alerts[alertId]);
                        if (alerts[alertId]) {
                            alerts[alertId].send(monitorConfig.name + ' is UP', 'System is now operational (' + statusCode + ')');
                        }
                    });
                }
            })
            .on('error', function(err) {
                console.error('Monitor',  monitorConfig.name, monitorConfig.type, 'is down -', err);
                if(monitorConfig.alerts) {
                    monitorConfig.alerts.forEach(function(alertId) {
                        console.log('alert', alertId, alerts[alertId]);
                        if (alerts[alertId]) {
                            alerts[alertId].send(monitorConfig.name + ' is DOWN', monitorConfig.name + ' is DOWN (' + statusCode + ')');
                        }
                    });
                }
            });
        monitor.start();
    }
});