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
            console.log('lockNext => ', err, result._id, result.url);
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
            console.log('unlock => ', err, result._id, result.url);
            nextLoop();
        });
    })
    .on('error', function(err) {
        //console.error('** Monitor',  currentData, 'is down -', err);
        dataManager.unlock(currentData, function(err, result) {
            console.log('unlock => ', err, result._id, result.url);
            nextLoop();
        });
    });

// API
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.get('/monitor', function(req, res) {
  dataManager.list(function(err, dataArr) {
    if(err) {
      res.json({"success": false, "message": err.message });
    }
    else {
      res.json({"success": true, "items": dataArr});
    }
  });
});
app.post('/monitor', function(req, res) {
    var data = {
      email: req.body.email,
      url: req.body.url
    };
    console.log('Route:: add monitor', typeof data, data);
    dataManager.add(data, function(err, data) {
      if(err) {
        res.json({"success": false, "message": err.message });
      }
      else {
        sendConfirmationEmail(req.protocol + '://' + req.get('host'), data._id, data.email, data.url);
        res.json({"success": true});
      }
    });
});
app.get('/monitor/:id/enable', function(req, res) {
    console.log('Route:: enable monitor', req.params.id);
    dataManager.enable({_id:require('mongodb').ObjectID(req.params.id)}, function(err) {
      console.log('enabled', err);
      if(err) {
        res.json({"success": false, "message": err.message });
      }
      else {
        res.json({"success": true});
      }
    });
});
app.get('/monitor/:id/disable', function(req, res) {
    console.log('Route:: enable monitor', req.params.id);
    dataManager.disable({_id:require('mongodb').ObjectID(req.params.id)}, function(err) {
      console.log('disabled', err);
      if(err) {
        res.json({"success": false, "message": err.message });
      }
      else {
        res.json({"success": true});
      }
    });
});
app.get('/monitor/:id/del', function(req, res) {
    console.log('Route:: del monitor', req.params.id);
    dataManager.del({_id:require('mongodb').ObjectID(req.params.id)}, function(err, results) {
      console.log('del', err, results);
      if(err) {
        res.json({"success": false, "message": err.message });
      }
      else {
        res.json({"success": true});
      }
    });
});

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

// confirmation emails
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(config.nodemailer);
function sendConfirmationEmail(serverUrl, id, email, url) {
    var callbackUrl = serverUrl + '/monitor/' + id + '/enable';
    console.log('sendConfirmationEmail', callbackUrl, email, url);
    transporter.sendMail({
        from: config.nodemailer.auth.user,
        to: email,
        subject: 'Confirm Monitor Creation',
        text: 'Please follow this link to confirm that you wish Monitoshi to warn you by email when ' + url + ' is down.\n' + callbackUrl
    });
}
