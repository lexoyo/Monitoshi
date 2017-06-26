// includes
var Db = require('mongodb').Db,
  ObjectID = require('mongodb').ObjectID,
  MongoClient = require('mongodb').MongoClient;
// config
var mongodbUri = process.env['MONGODB_URI'] ? process.env['MONGODB_URI'] : 'mongodb://localhost:27017/monitoshi';
var collectionName = process.env['MONITOSHI_COLLECTION_NAME'] ? process.env['MONITOSHI_COLLECTION_NAME'] : 'monitoshi';

/**
 * Handle data about monitored services
 * this means to access the DB and get/set data
 * @class DataManager
 */
module.exports = DataManager = function(ready) {
  // connect to db
  console.log('Connecting to mongodb ' + mongodbUri.substr(0, 30) + '... - collectionName=' + collectionName);
  // Use connect method to connect to the Server
  MongoClient.connect(mongodbUri, function(err, db) {
    this.db = db;
    if(err) {
      console.error('DataManager:: init db error', err);
      ready(err);
    }
    else this.db.collection(collectionName, function(err, collection) {
      this.collection = collection;
      if(err) console.error('DataManager:: init db error', err);
      else this.db.collection("storedData", function(err, collection) {
        this.collectionStoredData = collection;
        if(err) console.error('DataManager:: init db error', err);
      }.bind(this));
      ready(err);
    }.bind(this));
  }.bind(this));
};


/**
 * get the next data to process and lock it
 * @param {function(err:String, result:object)} cbk
 * @param {string} id of the runner which locks the data manager
 * @param {number} delay minimum allowed delay between last update and now
 */
DataManager.prototype.lockNext = function(delay, id, cbk) {
  // findAndModify oldest __lastProcessed with __lockedBy='' + set flag __lockedBy=ID_DYNO
  this.collection.findAndModify({
      __enabled: true,
      __lockedBy: '',
      __lastProcessed: {
        $lt: Date.now() - delay
      }
    }, [['__lastProcessed', 'ascending']], {
      $set: {__lockedBy: id}
    },
    {new: true},
  function(err, result) {
    cbk(err, result ? result.value : null);
  });
};


/**
 * unlock the data after process, update the __lastProcessed date
 * @param {function(err:String)} cbk
 */
DataManager.prototype.unlock = function(data, changes, cbk) {
  // update __lastProcessed + set flag __lockedBy=''
  changes.__lockedBy = '';
  changes.__lastProcessed = Date.now();
  this.collection.findAndModify(
    data, [], {
      $set: changes
    },
    {new: true},
  function(err, result) {
    cbk(err, result ? result.value : null);
  });
};


/**
 * unlock all the data locked with the given ID
 * @param {string} id of the runner which locks the data manager
 * @param {function(err:String)} cbk
 */
DataManager.prototype.unlockAll = function(cbk) {
// findAndModify doc with flag __lockedBy==ID_DYNO   => __lockedBy=''
 this.collection.update({
      // __lockedBy: id
    }, {
      $set: {__lockedBy: ''}
    },
    {multi: true},
  function(err, result) {
    cbk(err, result ? result.value : null);
  });
};


/**
* enable a data for processing
* @param {string} id
* @param {function(err:String)} cbk
*/
DataManager.prototype.enable = function(id, cbk) {
  var data = {_id:ObjectID(id)};
 this.collection.findAndModify(
    data, [], {
      $set: {
        __enabled: true,
        __lastProcessed: Date.now()
      }
    },
    {new: true},
  function(err, result) {
    cbk(err, result ? result.value : null);
  });
};


/**
* disable a data for processing
* @param {string} id
* @param {function(err:String)} cbk
*/
DataManager.prototype.disable = function(id, cbk) {
  var data = {_id:ObjectID(id)};
 this.collection.findAndModify(
    data, [], {
      $set: {
        __enabled: false
      }
    },
    {new: true},
  function(err, result) {
    cbk(err, result ? result.value : null);
  });
};


/**
* add a data item
* @param {object} data
* @param {function(err:String)} cbk
*/
DataManager.prototype.add = function(data, cbk) {
//     => this.collection.update(selector, document, { upsert: true });
//     => with flag __enabled = false
  data.__enabled = false,
  data.__lockedBy = '';
  data.__badgeId = Date.now() + '-' + Math.round(Math.random() * 9999);
  this.collection.insert([data], function(err, docs) {
    cbk(err, data);
  });
};


/**
* remove a data item
* @param {string} id
* @param {function(err:String)} cbk
*/
DataManager.prototype.del = function(id, cbk) {
  console.info('del will remove monitor:', id);
  var data = {_id:ObjectID(id)};
  this.collection.findOne(data, function(err, foundData) {
      if(err) {
          cbk(err, foundData);
      }
      else if(!foundData) {
          console.error('could not find record', data);
          cbk('could not find record', foundData);
      }
      else this.collection.remove(foundData, function(err, removed) {
          console.info('removed record', data, err);
          cbk(err, foundData);
      });
  }.bind(this));
};
/* */


/**
* dump the db
* @param {function(err:String, list: Array.<*>)} cbk
*/
DataManager.prototype.list = function(cbk) {
 this.collection.find().toArray(function(err, items) {
    cbk(err, items);
  });
};


/**
* @param {function(err:String, count:number)} cbk
*/
DataManager.prototype.count = function(cbk) {
 this.collection.find().count(function(err, count) {
    cbk(err, count);
  });
};


/**
* store arbitrary data
* @param {string} id
* @param {function(err:String)} cbk
*/
DataManager.prototype.store = function(name, update, cbk) {
  var data = {storedDataName:name};
  if (!update['$set']) update['$set'] = {};
  update['$set'].storedDataName = name;
 this.collectionStoredData.findAndModify(
    data, [], update,
    {new: true, upsert:true},
  function(err, result) {
    cbk(err, result ? result.value : null);
  });
};


/**
* store arbitrary data
* @param {string} name
* @param {function(err:String, value:*)} cbk
*/
DataManager.prototype.get = function(name, cbk) {
  var data = {storedDataName:name};
  this.collectionStoredData.findOne(
    data,
  function(err, result) {
    cbk(err, result);
  });
};


DataManager.prototype.getDataFromBadge = function(id, cbk) {
  var data = {__badgeId:id};
  this.collection.findOne(data, function(err, data) {
    cbk(err, data);
  }.bind(this));
};


DataManager.prototype.getIdFromBadge = function(id, cbk) {
  var data = {__badgeId:ObjectID(id)};
  this.collection.findOne(data, function(err, data) {
    cbk(err, data ? data._id : null);
  }.bind(this));
};


DataManager.prototype.getBadgeFromId = function(id, cbk) {
  var data = {_id:ObjectID(id)};
  this.collection.findOne(data, function(err, data) {
    cbk(err, data ? data.__badgeId : null);
  }.bind(this));
};


