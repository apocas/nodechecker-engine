require('colors');

var net           = require('net'),
  DuplexEmitter = require('duplex-emitter'),
  reconnect     = require('reconnect'),
  Test = require('nodechecker-tester');


var Worker = function (ip, port) {
  this.ip = ip;
  this.port = port;
};


Worker.prototype.connect = function () {
  var self = this;

  reconnect(function (socket) {
    console.log('Connected to dispatcher'.green);

    self.test = undefined;
    self.socket = socket;
    self.remote = DuplexEmitter(socket);

    self.remote.on('test', function(data) {
      console.log('RECEIVED (job): ' + JSON.stringify(data));
      self.test = new Test(data);
      self.test.test(function(result) {
        console.log('DONE (job): ' + JSON.stringify(data));
        self.remote.emit('done', {'job': data, 'result': result});
        self.disconnect();
      });
    });

    socket.once('end', onEnd);
    socket.on('error', onEnd);

    function onEnd() {
      console.log('Disconnected!'.red);
      if(self.test) {
        self.test.destroy();
      }
    }

  }).connect(self.port, self.ip);
};


Worker.prototype.disconnect = function () {
  this.socket.end();
};

module.exports = Worker;