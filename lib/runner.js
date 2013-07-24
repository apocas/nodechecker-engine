var sys = require('sys'),
  exec = require('child_process').exec,
  events = require('events'),
  Test = require('nodechecker-tester');

var Runner = function(mod, redis) {
  this.mod = mod;
  this.redis = redis;
};


sys.inherits(Runner, events.EventEmitter);


Runner.prototype.work = function() {
  var self = this;

  this.redis.sadd('running', this.mod.name);

  self.redis.multi()
    .hget('times', self.mod.name)
    .sismember(['ok', self.mod.name])
    .sismember(['nok', self.mod.name])
    .sismember(['failed', self.mod.name])
    .sismember(['rfailed', self.mod.name])
    .sismember(['inexistent', self.mod.name])
    .exec(function (err, replies) {
      var expired = (replies[0] === null || (new Date().getTime()) - replies[0] > (60000 * 60 * 24 * 3));

      if(replies[0] === null || replies[4] == 1) {
        new Test({'module': self.mod.name}).test(function(result) {
          self.done(result);
        });
      } else {
        if(expired) {
          if(replies[2] == 1) {
            if(self.mod.repository !== undefined && self.mod.repository.type == 'git' && self.mod.repository.url !== undefined && self.mod.repository.url.length > 0) {
              new Test({'repository': self.mod.repository.url}).test(function(result) {
                self.done(result);
              });
            } else {
              self.done(null);
            }
          } else if(replies[5] == 1) {
            new Test({'module': self.mod.name}).test(function(result) {
              self.done(result);
            });
          } else {
            self.done(null);
          }
        } else {
          self.done(null);
        }
      }
    });
};


Runner.prototype.done = function (result) {
  var self = this;

  if(result !== undefined && result !== null) {
    //console.log(result);

    if(result.output !== null && result.output !== undefined) {
      this.redis.hset('output', this.mod.name, result.output);
    }

    self.redis.hset('times', this.mod.name, new Date().getTime());

    self.redis.srem('failed', this.mod.name);
    self.redis.srem('rfailed', this.mod.name);
    self.redis.srem('inexistent', this.mod.name);
    self.redis.srem('ok', this.mod.name);
    self.redis.srem('nok', this.mod.name);

    switch(result.result) {
      case 'ok':
        self.redis.sadd('ok', this.mod.name);
        break;
      case 'nottested':
        self.redis.sadd('inexistent', this.mod.name);
        break;
      case 'nok':
        self.redis.sadd('nok', this.mod.name);
        break;
      case 'timedout':
        console.log('TIMEDOUT! ' + this.mod.name);
        self.redis.sadd('failed', this.mod.name);
        self.redis.hset('times', this.mod.name, new Date().getTime());
        break;
      case 'tarball':
        console.log('TARBALL INVALID! ' + this.mod.name);
        self.redis.sadd('rfailed', this.mod.name);
        self.redis.hset('times', this.mod.name, new Date().getTime());
        break;
    }

    console.log('DONE! ' + this.mod.name + ' with code ' + result.result);
  }

  this.emit('done');
};


module.exports = Runner;