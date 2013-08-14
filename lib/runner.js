var sys = require('sys'),
  events = require('events'),
  Test = require('nodechecker-tester');

var Runner = function(type, opt) {
  this.type = type;
  this.opt = opt;
};


sys.inherits(Runner, events.EventEmitter);


Runner.prototype.work = function() {
  var self = this;
  new Test(self.type, self.opt).test(function(result) {
    self.done(result);
  });
};


Runner.prototype.done = function (result) {
  this.emit('done', result);
};


module.exports = Runner;