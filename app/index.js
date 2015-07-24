// imports
var express    = require('express');
var app = module.exports = express();
var bodyParser = require('body-parser');

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
console.info('Monitoshi starting');
console.info('***********************************');

var WebHookAlert = require('./alert/web-hook');
var PingMonitor = require('./monitor/ping');
var monitor = new PingMonitor(config.timeout, config.interval, config.attempts);
// loop on data
var DataManager = require('./queue/data-manager');
var dataManager = new DataManager();
dataManager.unlockAll(function(err, result) {
  nextLoop();
});
var currentData = null;


function nextLoop() {
    dataManager.lockNext(function(err, result) {
        if(result) {
            // no data in the DB
            console.log('lockNext => ', err, result._id);
            currentData = result;
            monitor.poll(currentData.url);
        }
        else {
            console.log('no confirmed items found in the db');
            setTimeout(nextLoop, 100);
        }
    });
}

monitor
    .on('success', function(statusCode) {
        //console.log('** Monitor',  currentData, 'is up', statusCode);
        dataManager.unlock(currentData, function(err, result) {
            console.log('unlock => ', err, result._id);
            nextLoop();
        });
    })
    .on('error', function(err) {
        //console.error('** Monitor',  currentData, 'is down -', err);
        dataManager.unlock(currentData, function(err, result) {
            console.log('unlock => ', err, result._id);
            nextLoop();
        });
    });

// API
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.post('/item', function(req, res) {
    var data = JSON.parse(req.body.data || req.body);
    console.log('Route:: add item', typeof data, data);
    dataManager.add(data, function(err, data) {
      if(err) {
        res.json({"success": false, "message": err.message });
      }
      else {
        res.json({"success": true});
      }
    });
});
app.get('/item/:id/confirm', function(req, res) {
    console.log('Route:: confirm item', req.params.id);
    dataManager.enable(require('mongodb').ObjectID(req.params.id), function(err) {
      console.log('enabled');
      if(err) {
        res.json({"success": false, "message": err.message });
      }
      else {
        res.json({"success": true});
      }
    });
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
