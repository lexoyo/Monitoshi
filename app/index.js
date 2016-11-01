// imports
var express    = require('express');
var app = module.exports = express();
var bodyParser = require('body-parser');
var Logger = require('./logger');
var logger = new Logger();

// config
var config;
if (process.env.MT_CONFIG) {
    config = JSON.parse(process.env.MT_CONFIG);
}
else {
    var fs = require('fs');
    var configFile = process.env.MT_CONFIG_FILE || __dirname + '/../config.js';
    config = require(configFile);
    console.log('MT_CONFIG env variable is not defined, and MT_CONFIG_FILE is set to',
        process.env.MT_CONFIG_FILE,
        'The config will be read from', configFile);
}
function displayResult(req, res, data) {
  if(req.query.format === 'json') {
    if(data.success === true) res.status(200);
    else res.status(500);
    res.json(data);
  }
  else {
    if(data.success === true) {
      var footer = '<hr>Thank you for using <a href="https://github.com/lexoyo/Monitoshi/" target="_blank">Monitoshi</a>';
      if(data.message) {
        res.status(200).send('<h1>' + data.message + '</h1>' + footer);
      }
      else {
        res.status(200).send('<h1>List of monitors</h1>' + formatList(data.items) + footer);
      }

    }
    else {
      res.status(500).send('<h1>' + (data.message || '') + '</h1><hr>Something went wrong, we are sorry about that. Here is <a href="https://github.com/lexoyo/Monitoshi/issues" target="_blank">the help section of Monitoshi</a>.');
    }
  }
}
function formatList (items) {
  return '<ul>' + items.map(function(item) {
    return `<li><ul>
      <li>${item.url} (${ item.__enabled ? 'confirmed' : 'NOT confirmed' }, ${ item.state || 'Unknown' }, ${ item.email }, created ${ item.created }, last ping ${ item.__lastProcessed })</li>
      <li><a href="/monitor/${ item._id }/enable">enable</a></li>
      <li><a href="/monitor/${ item._id }/disable">disable</a></li>
      <li><a href="/monitor/${ item._id }/del">del</a></li>
      <li><a href="/badge/${ item.__badgeId }"><img src="/badge/${ item.__badgeId }"/></a></li>
      </ul></li>`;
  })
  .join('') + '</ul>';
}
console.info('***********************************');
console.info('Monitoshi starting');
console.info('***********************************');

var WebHookAlert = require('./alert/web-hook');
var PingMonitor = require('./monitor/ping');
var monitor = new PingMonitor(config.timeout, config.interval, config.attempts);

// loop on data
var DataManager = require('./queue/data-manager');
var dataManager = new DataManager('inst1', init);
var currentData = null;

function init() {
  dataManager.store('stats',  {
    $setOnInsert: {
      created: Date.now(),
    },
    $inc: {
      downtimesCount: 1
    }
  }, function(err, result) {
    // init for each boot
    dataManager.store('stats',  {
      $set: {
        lastReboot: Date.now(),
      },
      $inc: {
        'pingsPerHours.0': 0, // create the field if it does not exist
      }
    }, function(err, result) {
      console.log('started', err, result);
      nextLoop();
    });
  });
}

function nextLoop() {
    dataManager.unlockAll(function(err, result) {
        dataManager.lockNext(config.interval, function(err, result) {
            if(result) {
                currentData = result;
                monitor.poll(currentData.url);
                // remember number of pings per hours
                const inc = {};
                const set = {};
                // increment current hour
                inc['pingsPerHours.' + (new Date()).getHours()] = 1;
                // reset next hour
                set['pingsPerHours.' + ((new Date()).getHours() + 1) % 24] = 0;
                dataManager.store('stats',  {
                  $inc: inc,
                  $set: set,
                }, function(err, result) {
                  console.log('stats', result);
                });
            }
            else {
                // no data in the DB
                setTimeout(nextLoop, 100);
            }
        });
    });
}
monitor
.on('success', function(statusCode) {
    if(currentData.state === 'down') {
        console.info('** Monitor',  currentData, 'is now up', statusCode);
        sendUpEmail(currentData);
    }
    dataManager.unlock(currentData, {state: 'up'}, function(err, result) {
        nextLoop();
    });
})
.on('error', function(err) {
    if(currentData.state === 'up') {
        console.info('** Monitor',  currentData, 'is now down -', err);
        sendDownEmail(currentData);
        dataManager.store('stats',  {
          $inc: {
            downtimesCount: 1
          }
        }, function(err, result) {});
    }
    dataManager.unlock(currentData, {state: 'down'}, function(err, result) {
        nextLoop();
    });
});

// API
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
if(process.env.MONITOSHI_ADMIN_PASS) {
  app.get('/' + process.env.MONITOSHI_ADMIN_PASS + '/', function(req, res) {
    dataManager.list(function(err, dataArr) {
      if(err) {
        displayResult(req, res, {"success": false, "message": err.message });
      }
      else {
        displayResult(req, res, {"success": true, "items": dataArr});
      }
    });
  });
}
app.post('/monitor', function(req, res) {
    var data = {
      email: req.body.email,
      url: req.body.url,
      serverUrl: req.protocol + '://' + req.get('host'),
      created: Date.now()
    };
    console.info('Route:: add monitor', typeof data, data);
    dataManager.add(data, function(err, data) {
      if(err) {
          displayResult(req, res, {"success": false, "message": err.message });
      }
      else {
          if(data) {
              sendConfirmationEmail(req.protocol + '://' + req.get('host'), data._id, data.email, data.url);
              displayResult(req, res, {"success": true, "message": "The monitor is created, please check your emails and activate it."});
          }
          else {
              displayResult(req, res, {"success": false, "message": "Monitor not found." });
          }
      }
    });
});

app.get('/info', function(req, res) {
    dataManager.count(function(err, count) {
        dataManager.get('stats', function(err, stats) {
            if(!stats) stats = {};
            let pingsIntervalPerUrl = 0;
            if(stats.pingsPerHours) {
              let pingsPerHour = 0;
              for(let hour in stats.pingsPerHours) {
                pingsPerHour += stats.pingsPerHours[hour];
              }
              // compute the interval between 2 pings (using the pingsPerHours value which logs pings of the last 23 hours)
              if(pingsPerHour > 0) pingsIntervalPerUrl = Math.round(count * 23 * 60 * 60 / pingsPerHour);
            }
            res.render('info.ejs', {
                "downtimes": stats.downtimesCount,
                "created": new Date(stats.created),
                "monitors": count,
                "pingsIntervalPerUrl": pingsIntervalPerUrl
            });
        });
    });
});

app.get('/monitor/:id/enable', function(req, res) {
    console.log('Route:: enable monitor', req.params.id);
    dataManager.enable(req.params.id, function(err, data) {
      if(err) {
          displayResult(req, res, {"success": false, "message": err.message });
      }
      else {
          if(data) {
            sendStartEmail(req.protocol + '://' + req.get('host'), data._id, data.email, data.url, data.__badgeId);
            displayResult(req, res, {"success": true, "message": "The monitor is now active."});
          }
          else {
              displayResult(req, res, {"success": false, "message": "Monitor not found." });
          }
      }
    });
});
app.get('/monitor/:id/disable', function(req, res) {
    console.log('Route:: disable monitor', req.params.id);
    dataManager.disable(req.params.id, function(err) {
      if(err) {
        displayResult(req, res, {"success": false, "message": err.message });
      }
      else {
        displayResult(req, res, {"success": true, "message": "The monitor has been disabled."});
      }
    });
});
app.get('/monitor/:id/del', function(req, res) {
    console.log('Route:: del monitor', req.params.id);
    dataManager.del(req.params.id, function(err, data) {
      if(err) {
        displayResult(req, res, {"success": false, "message": err.message });
      }
      else {
        if(data) {
            sendStopEmail(req.protocol + '://' + req.get('host'), data._id, data.email, data.url);
            displayResult(req, res, {"success": true, "message": "The monitor has been deleted."});
        }
        else {
            displayResult(req, res, {"success": false, "message": "Monitor not found." });
        }
      }
    });
});
const badge = require('gh-badges');
const url = require('url');
function serveBadge(res, left, right, color) {
  badge({ text: [left, right], colorscheme: color, template: "flat" },
    function(svg, err) {
      if(err) {
        res.status(500).send('');
      }
      else {
        res.type('svg').status(200).send(svg);
      }
    }
  );
}
app.get('/badge/:id', function(req, res) {
  dataManager.getDataFromBadge(req.params.id, function(err, data) {
    console.log('Route:: badge', req.params.id, data);
    if(err) {
      serveBadge(res, 'badge', 'error', 'grey');
    }
    else {
      if(data) {
        const color = data.state === 'up' ? 'green' : data.state === 'down' ? 'red' : 'grey';
        const domain = url.parse(data.url).hostname;
        serveBadge(res, domain, data.state ? data.state : 'unknown yet', color);
      }
      else {
        serveBadge(res, 'badge', 'error', 'grey');
      }
    }
  });
});

// public folder
app.use('/', express.static(__dirname + '/../public'));
// template engine
app.set('view engine', 'ejs');
app.set('views', 'app/views');

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
        subject: 'Confirm monitor creation',
        text: 'Click the link bellow to allow Monitoshi to warn you by email when your site (' + url + ') is down.\n\n' + callbackUrl
    });
}
function sendStartEmail(serverUrl, id, email, url, badgeId) {
    var callbackUrl = serverUrl + '/monitor/' + id + '/del';
    var badgeUrl = serverUrl + '/badge/' + badgeId;
    console.log('sendStartEmail', callbackUrl, email, url, badgeUrl);
    transporter.sendMail({
        from: config.nodemailer.auth.user,
        to: email,
        subject: 'Monitor Created',
        text: 'This is an email to confirm that Monitoshi will warn you by email when ' + url + ' is down.\n\nIf you want TO DELETE it one day, and prevent Monitoshi to watch for this website, follow this link: ' + callbackUrl +
          '\n\nAnd if you need a badge to display the state of your site (up or down), use this URL: ' + badgeUrl
    });
}
function sendStopEmail(serverUrl, id, email, url) {
    console.log('sendStopEmail', email, url);
    transporter.sendMail({
        from: config.nodemailer.auth.user,
        to: email,
        subject: 'Monitor Deleted',
        text: 'This is an email to confirm the deletion of a monitor. Monitoshi will not warn you anymore when ' + url + ' is down.'
    });
}
function sendDownEmail(data) {
    var callbackUrl = data.serverUrl + '/monitor/' + data._id + '/del';
    console.log('sendDownEmail', data.email, data.url);
    transporter.sendMail({
        from: config.nodemailer.auth.user,
        to: data.email,
        subject: '[Alert]Your website is DOWN',
        text: 'This is an email to warn you that ' + data.url + ' is down.\n\nIf you want me to stop monitoring this website, follow this link: ' + callbackUrl
    });
}
function sendUpEmail(data) {
    var callbackUrl = data.serverUrl + '/monitor/' + data._id + '/del';
    console.log('sendUpEmail', data.email, data.url);
    transporter.sendMail({
        from: config.nodemailer.auth.user,
        to: data.email,
        subject: '[Alert]Your website is UP',
        text: 'This is an email to inform you that ' + data.url + ' is up again.\n\nIf you want me to stop monitoring this website, follow this link: ' + callbackUrl
    });
}
