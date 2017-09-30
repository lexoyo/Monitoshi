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
    var configFile = process.env.MT_CONFIG_FILE || __dirname + '/../config.js';
    config = require(configFile);
    console.log('MT_CONFIG env variable is not defined, and MT_CONFIG_FILE is set to',
        process.env.MT_CONFIG_FILE,
        'The config will be read from', configFile);
}
const NUM_RUNNERS = config.num_runners || process.env['NUM_RUNNERS'] || 10;

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

const EMailAlert = require('./alert/EMail.js');
const eMailAlert = new EMailAlert(config);
const AlertData = require('./alert/AlertData.js');
const alertData = new AlertData(config);
const AlertType = require('./alert/AlertData.js').AlertType;
const WebHookAlert = require('./alert/web-hook');
const webHookAlert = new WebHookAlert(config);
const Runner = require('./runner');

// loop on data
var DataManager = require('./queue/data-manager');
var dataManager = new DataManager(() => {
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
    });
  });
  dataManager.unlockAll((err, result) => {
    console.log('unlockAll done (err=', err, ')');
    let num = 0;
    for(idx=0; idx<NUM_RUNNERS; idx++) {
      setTimeout(
        () => new Runner(config, `runner${num++}_${Math.round(Math.random()*1000000000).toString(26)}`, dataManager, eMailAlert, alertData, webHookAlert),
        100 * num);
    }
  });
});

// API
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
if(process.env.MONITOSHI_ADMIN_PASS) {
  console.warn('there is an admin pass, the dashboard will be exposed!!');
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
              eMailAlert.send(alertData.createEvent(AlertType.CONFIRM, data));
              webHookAlert.send(alertData.createEvent(AlertType.CONFIRM, data));
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
              const pingsPerHour = stats.pingsPerHours[((new Date()).getHours() - 1) % 24];
              // compute the interval between 2 pings (using the pingsPerHours of the last hour)
              if(pingsPerHour) pingsIntervalPerUrl = Math.round(count * 60 * 60 / pingsPerHour);
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
            eMailAlert.send(alertData.createEvent(AlertType.START, data));
            webHookAlert.send(alertData.createEvent(AlertType.START, data));
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
            eMailAlert.send(alertData.createEvent(AlertType.STOP, data));
            webHookAlert.send(alertData.createEvent(AlertType.STOP, data));
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
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Expires', '0');
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
