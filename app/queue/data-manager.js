var mongoose = require('mongoose');

/**
 * Handle data about monitored services
 * this means to access the DB and get/set data
 * @class DataManager
 */
module.exports = DataManager = function() {
  // connect to db
  var connectionUri = 'mongodb://localhost/test';
  mongoose.connect(connectionUri);
  db.on('error', console.error.bind(console, 'DB connection error:'));
  // store the db
  var collectionName = 'monitoshi'
  this.db = mongoose[collectionName]
  // define schema
  this.DataModel = mongoose.model('Data', {
    url: String,
    email: String
  });
};


/**
 * get the next data to process and lock it
 * @param {string} id
 * @return {object}
 * @param {function(err:String, result:object)} cbk
 */
DataManager.prototype.lockNext = function(id, cbk) {
  // findAndModify oldest lastProcessed with processing=null + set flag processing=ID_DYNO
  this.db.findOneAndUpdate(data, function (err) {
    cbk(err, result);
  });
};


/**
 * unlock the data
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.unlock = function(data, cbk) {
  // update lastProcessed + set flag processing=null
  this.db.findOneAndUpdate(data, function (err) {
    cbk(err);
  });
};


/**
 * unlock all the data locked with the given ID
 * @param {string} id
 * @param {function(err:String)} cbk
 */
DataManager.prototype.unlockAll = function(id, cbk) {
  // findAndModify doc with flag processing==ID_DYNO   => processing=null
  this.db.findAndModify(data, function (err) {
    cbk(err);
  });
};


/**
 * enable
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.enable = function(data, cbk) {
  //
}


/**
 * add a data item
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.add = function(data, cbk) {
  //     => collection.update(selector, document, { upsert: true });
  //     => with flag confirmed = false
  var dataModel = new this.DataModel({
    email: data.email,
    url: data.url
  });
  dataModel.save(function (err) {
    cbk(err);
  });
};


/**
 * remove a data item
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.remove = function(data, cbk) {
  this.db.findOneAndRemove(data, function (err) {
    cbk(err);
  });
};
