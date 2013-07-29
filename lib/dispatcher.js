var sys = require('sys'),
  events = require('events'),
  Runner = require('./runner'),
  os = require('os');

var Dispatcher = function (redis) {
  this.buffer = [];
  this.working = 0;
  this.total = 0;
  this.done = 0;
  this.slimit = 2;
  this.redis = redis;
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

  if(this.buffer.length == 1) {
    this.reload();
  }
};

Dispatcher.prototype.start = function () {
  console.log('Dispatcher started!');
  var self = this;
};

Dispatcher.prototype.reload = function() {
  if(this.working < this.slimit) {
    this.working++;
    var runner = this.buffer.pop();
    if(runner !== undefined) {
      runner.work();
    }
  }
};

Dispatcher.prototype.ajustLimits = function() {
  var mem = os.freemem();
  var load = os.loadavg()[0];
  var aux = parseInt(mem / 536870912);
  if(aux > 2 && load < 5.0) {
    this.slimit = aux;
    console.log('Adjusting workers limit: ' + this.slimit);
  } else {
    this.slimit = 2;
  }
};

module.exports = Dispatcher;