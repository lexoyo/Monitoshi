// imports
var DataManager = require('data-manager');
var dataManager = new DataManager();

/**
 * Process a list of items in a loop
 * @class Processor
 * @param {string} dynoId
 */
module.exports = Processor = function(dynoId) {
  this.dynoId = dynoId;
  this.started = false;
  this.stop = false;
};


/**
 * stop the process
 * this will take effect after the current data has been processed
 */
Processor.prototype.stop = function() {
  this.stop = true;
};


/**
 * start the process and loop on items in the db
 * @param {function(data, done)} processFunc the function which you provide to process items
 */
Processor.prototype.start = function(processFunc) {
  this.stop = false;
  if(this.started === true) {
    console.warn('Processor alreaded started, do nothing');
    return;
  }
  this.started = true;
  // start by unlocking all items which may have been locked before a server crash
  dataManager.unlockAll(this.dynoId);
  // start the loop
  this.loop_(processFunc);
};


/**
 * loop on items in the db
 * @param {function(serviceData, done)} processFunc the function which you provide to process items
 * @private
 */
Processor.prototype.loop_ = function(processFunc) {
  // get the next data to process and lock it
  var data = dataManager.lockNext();
  // process the data
  processFunc(data, function() {
    // unlock the data
    dataManager.unlock(data);
    // continue the loop
    if(this.stop === false) {
      this.loop_(processFunc);
    }
  }.bind(this));
};
