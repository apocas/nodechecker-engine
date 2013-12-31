var sys = require('sys'),
  events = require('events'),
  Runner = require('./runner'),
  os = require('os');

var Dispatcher = function () {
  this.buffer = [];
  this.working = 0;
  this.done = 0;
  this.slimit = 6;
};

sys.inherits(Dispatcher, events.EventEmitter);

Dispatcher.prototype.dispatch = function(runner) {
  var self = this;

  runner.on('done', function(result) {
    self.done++;
    self.working--;
    //console.log('-- WORKING - ' + self.working + '/' + self.buffer.length + ' ' + this.opt.module);
    self.reload();
    this.emit('finished', result);
  });

  this.buffer.push(runner);

  this.reload();
};

Dispatcher.prototype.start = function (cb) {
  console.log('Dispatcher started!');
  cb();
};

Dispatcher.prototype.reload = function() {
  if(this.working < this.slimit) {
    var runner = this.buffer.splice(0,1)[0];
    console.log(runner);
    if(runner !== undefined) {
      this.working++;
      //console.log('++ WORKING - ' + this.working + '/' + this.buffer.length + ' ' + runner.opt.module);
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