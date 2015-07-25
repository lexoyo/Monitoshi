// includes
var Db = require('mongodb').Db,
  Server = require('mongodb').Server;

// config
var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;
var dbName = process.env['MONITOSHI_DB_NAME'] != null ? process.env['MONITOSHI_DB_NAME'] : 'monitoshi';
var collectionName = process.env['MONITOSHI_COLLECTION_NAME'] != null ? process.env['MONITOSHI_COLLECTION_NAME'] : 'monitoshi';
var idDyno = 'xxx1';

/**
 * Handle data about monitored services
 * this means to access the DB and get/set data
 * @class DataManager
 */
module.exports = DataManager = function() {
  // connect to db
  console.log("Connecting to " + host + ":" + port);
  this.db = new Db(dbName, new Server(host, port, {}), {native_parser:true});
};


/**
 * prepare the db connection and get the collection
 * @param {function(err:String, collection:object, done)} cbk
 */
DataManager.prototype.getCollection = function(cbk) {
  this.db.open(function(err, db) {
    if(db) {
      db.collection(collectionName, function(err, collection) {
        cbk(err, collection, function() {
          db.close();
        });
      });
    }
  });
};


/**
 * get the next data to process and lock it
 * @return {object}
 * @param {function(err:String, result:object)} cbk
 */
DataManager.prototype.lockNext = function(cbk) {
  // findAndModify oldest __lastProcessed with __lockedBy='' + set flag __lockedBy=ID_DYNO
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      collection.findAndModify({
          __enabled: true,
          __lockedBy: ''
        }, [['__lastProcessed', 'ascending']], {
          $set: {__lockedBy: idDyno}
        },
        {new: true},
      function(err, result) {
        cbk(err, result ? result.value : null);
        done();
      });
    }
  });
};


/**
 * unlock the data after process, update the __lastProcessed date
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.unlock = function(data, changes, cbk) {
  // update __lastProcessed + set flag __lockedBy=''
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      changes.__lockedBy = '';
      changes.__lastProcessed = Date.now();
      collection.findAndModify(
        data, [], {
          $set: changes
        },
        {new: true},
      function(err, result) {
        cbk(err, result ? result.value : null);
        done();
      });
    }
  });
};


/**
 * unlock all the data locked with the given ID
 * @param {function(err:String)} cbk
 */
DataManager.prototype.unlockAll = function(cbk) {
  // findAndModify doc with flag __lockedBy==ID_DYNO   => __lockedBy=''
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      collection.update({
          __lockedBy: idDyno
        }, {
          $set: {__lockedBy: ''}
        },
        {multi: true},
      function(err, result) {
        cbk(err, result ? result.value : null);
        done();
      });
    }
  });
};


/**
 * enable a data for processing
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.enable = function(data, cbk) {
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      collection.findAndModify(
        data, [], {
          $set: {
            __enabled: true
          }
        },
        {new: true},
      function(err, result) {
        console.log('enable result:', err, result);
        cbk(err, result ? result.value : null);
        done();
      });
    }
  });
};


/**
 * disable a data for processing
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.disable = function(data, cbk) {
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      collection.findAndModify(
        data, [], {
          $set: {
            __enabled: false
          }
        },
        {new: true},
      function(err, result) {
        console.log('disable result:', err, result);
        cbk(err, result ? result.value : null);
        done();
      });
    }
  });
};


/**
 * add a data item
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.add = function(data, cbk) {
  //     => collection.update(selector, document, { upsert: true });
  //     => with flag __enabled = false
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      data.__enabled = false,
      data.__lockedBy = '';
      collection.insert([data], function(err, docs) {
        cbk(err, data);
      });
    }
  });
};


/**
 * remove a data item
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.del = function(data, cbk) {
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      collection.findOne(function(err, data) {
          if(err) {
              cbk(err, data);
              done();
          }
          else collection.remove(data, function(err, removed) {
              console.log('xxxx', err, err, data)
              cbk(err, data);
              done();
          });
      });
    }
  });
};
/* */


/**
 * dump the db
 * @param {object} data
 * @param {function(err:String)} cbk
 */
DataManager.prototype.list = function(cbk) {
  this.getCollection(function(err, collection, done) {
    if(err) {
      cbk(err, result);
      done();
    }
    else {
      collection.find().toArray(function(err, items) {
        cbk(err, items);
        done();
      });
    }
  });
};
