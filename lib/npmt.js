var JSONStream = require('JSONStream'),
    Dispatcher = require('./dispatcher'),
    redis = require("redis"),
    request = require('request');


var Npmt = function() {
  var self = this;

	this.redis_client = redis.createClient(7556, '130.185.82.11');

  this.dispatcher = new Dispatcher(this.redis_client);

  this.dispatcher.on('finished', function() {
    console.log('Finished this run.');
    process.exit(0);
  });

  this.dispatcher.start();
};


Npmt.prototype.run = function () {
  console.log('Starting a new run.');
	var self = this;
	self.redis_client.del('running');

  var parser = JSONStream.parse();
  request('http://registry.npmjs.org/-/all').pipe(parser);

	parser.on('root', function (obj) {
    self.redis_client.hkeys('times', function(err, members) {
      for (var i = 0; i < members.length; i++) {
        if(obj[members[i]] === undefined)  {
          self.removeOld(members[i]);
        }
      }
    });

    for(var prop in obj) {
      if(obj[prop].name) {
        self.dispatcher.dispatch(obj[prop]);
      }
    }
  });
};

//multi needed...
Npmt.prototype.removeOld = function(mname) {
  this.redis_client.srem('failed', mname);
  this.redis_client.srem('rfailed', mname);
  this.redis_client.srem('inexistent', mname);
  this.redis_client.srem('ok', mname);
  this.redis_client.srem('nok', mname);
  this.redis_client.hdel('times', mname);
  console.log('REMOVED: ' + mname);
};

module.exports = Npmt;