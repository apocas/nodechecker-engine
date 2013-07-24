var sys = require('sys'),
  events = require('events'),
  Runner = require('./runner');

var Dispatcher = function (redis) {
  this.buffer = [];
  this.working = 0;
  this.total = 0;
  this.done = 0;
  this.redis = redis;
  console.log('Dispatcher started!');
};

sys.inherits(Dispatcher, events.EventEmitter);

Dispatcher.prototype.dispatch = function(module) {
  var self = this;

  var runner = new Runner(module, self.redis);

  runner.on('done', function() {
    self.done++;
    self.working--;
    self.redis.srem('running', this.mod.name);
    self.reload();

    if(self.done >= self.total) {
      self.emit('finished');
    }
  });

  this.total++;
  this.buffer.push(runner);
  this.reload();
};

Dispatcher.prototype.reload = function() {
  if(this.working < 2) {
    this.working++;
    var runner = this.buffer.pop();
    if(runner !== undefined) {
      runner.work();
    }
  }
};

module.exports = Dispatcher;