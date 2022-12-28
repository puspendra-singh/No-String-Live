var MongoClient = require("mongodb").MongoClient;
var _db;
/**
 * Database connection
 * */
module.exports = {
  connectTOServer: function (callback) {
    MongoClient.connect(process.env.MONGO_URL, function (
      err,
      connection
    ) {
      var database = connection.db(process.env.DATABASE_NAME);
      _db = database;
      callback(err);
    });
  },
  getDb: function () {
    return _db;
  },
};
