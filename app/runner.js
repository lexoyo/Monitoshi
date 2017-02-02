const AlertType = require('./alert/AlertData.js').AlertType;
const PingMonitor = require('./monitor/ping');

module.exports = class Runner {
  constructor(config, id, dataManager, eMailAlert, alertData, webHookAlert) {
    this.monitor = new PingMonitor(config.timeout, config.interval);
    this.currentData = {};
    this.monitor
    .on('success', (statusCode) => {
        if(this.currentData.state === 'down') {
            console.info('** Monitor',  this.currentData.url, 'is now up', statusCode);
            eMailAlert.send(alertData.createEvent(AlertType.UP, this.currentData));
            webHookAlert.send(alertData.createEvent(AlertType.UP, this.currentData));
        }
        dataManager.unlock(this.currentData, {state: 'up', consecutiveFails: 0}, (err, result) => {
            this.run(config, id, dataManager, eMailAlert, alertData, webHookAlert);
        });
    })
    .on('error', (err) => {
        let consecutiveFails = this.currentData.consecutiveFails || 0;
        let state = this.currentData.state || 'down';
        if(state === 'up' && consecutiveFails >= config.attempts) {
            console.info('** Monitor',  this.currentData.url, 'is now down -', err);
            state = 'down';
            eMailAlert.send(alertData.createEvent(AlertType.DOWN, this.currentData));
            webHookAlert.send(alertData.createEvent(AlertType.DOWN, this.currentData));
            dataManager.store('stats',  {
              $inc: {
                downtimesCount: 1
              }
            }, (err, result) => {});
        }
        dataManager.unlock(this.currentData, {state: state, consecutiveFails: consecutiveFails + 1}, (err, result) => {
            this.run(config, id, dataManager, eMailAlert, alertData, webHookAlert);
        });
    });
    this.run(config, id, dataManager, eMailAlert, alertData, webHookAlert);
  }
  run(config, id, dataManager, eMailAlert, alertData, webHookAlert) {
      dataManager.lockNext(config.interval, id, (err, result) => {
          if(result) {
              this.currentData = result;
              console.log('runner', id, 'takes monitor', this.currentData.url);
              this.monitor.poll(this.currentData.url);
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
              }, (err, result) => {
                // success
                // console.log('stats', result);
              });
          }
          else {
              // no data in the DB
              setTimeout(
                () => this.run(config, id, dataManager, eMailAlert, alertData, webHookAlert),
                config.interval
              );
          }
      });
  }
}
