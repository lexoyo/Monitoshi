// imports
var express    = require('express');
var app = module.exports = express();

// config
var config;
if (process.env.MT_CONFIG) {
    config = JSON.parse(process.env.MT_CONFIG);
}
else {
    var fs = require('fs');
    var configFile = process.env.MT_CONFIG_FILE || __dirname + '/../default-config.js';
    config = require(configFile);
    console.log('MT_CONFIG env variable is not defined, and MT_CONFIG_FILE is set to',
        process.env.MT_CONFIG_FILE,
        'The config will be read from', configFile);
}
console.info('***********************************');
console.info('Monitoshi starting with', config.monitors.length, 'monitors.');
console.info('***********************************');

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
                console.log('** Monitor',  monitorConfig.name, monitorConfig.type, 'is up', statusCode);
                if(monitorConfig.alerts) {
                    monitorConfig.alerts.forEach(function(alertId) {
                        console.log('alert', alertId);
                        if (alerts[alertId]) {
                            monitorConfig.status = statusCode;
                            alerts[alertId].send(
                                resolveTemplate(alerts[alertId].config['up_title'], monitorConfig),
                                resolveTemplate(alerts[alertId].config['up_details'], monitorConfig),
                                resolveTemplate(alerts[alertId].config['up_details_no_html'], monitorConfig)
                            );
                        }
                    });
                }
            })
            .on('error', function(err) {
                console.error('** Monitor',  monitorConfig.name, monitorConfig.type, 'is down -', err);
                if(monitorConfig.alerts) {
                    monitorConfig.alerts.forEach(function(alertId) {
                        console.log('alert', alertId);
                        if (alerts[alertId]) {
                            monitorConfig.status = err.toString();
                            alerts[alertId].send(
                                resolveTemplate(alerts[alertId].config['down_title'], monitorConfig),
                                resolveTemplate(alerts[alertId].config['down_details'], monitorConfig),
                                resolveTemplate(alerts[alertId].config['down_details_no_html'], monitorConfig)
                            );
                        }
                    });
                }
            });
        monitor.start();
    }
});

// utility function
function resolveTemplate(str, obj) {
    var res = str;
    for(var idx in obj) {
        var reg = new RegExp('{{' + idx + '}}', 'g');
        res = res.replace(reg, obj[idx]);
    }
    res = res.replace(/{{date}}/g, (new Date()).toString());
    res = res.replace(/{{env}}/g, process.env.MT_ENV);
    return res;
}

// API
app.get('/isup/', function(res, res) {
    res.send('{"success": true}')
});
// app.get('/isup/:idx', require('./routes/isup.js'));

// public folder
app.use('/', express.static(__dirname + '/../public'));

// listen to http requests
if (!module.parent) {
  var port = process.env.PORT || 7070;
  app.listen(port, function() {
    console.log('Listening on ' + port);
  });
}
else {
    console.log('do not listen to any port since there is a parent app');
}
