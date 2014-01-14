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

    self.socket = socket;
    self.remote = DuplexEmitter(socket);

    self.remote.on('test', function(data) {
      if(data.type === 'repo') {
        console.log('RECEIVED (repo): ' + data.repository + ' - ' + data.branch);
        new Test('repo', {'repository': data.repository, 'branch': data.branch}).test(function(result) {
          console.log('DONE (repo): ' + data.repository + ' - ' + data.branch);
          self.remote.emit('done', {'type': data.type, 'repository': data.repository, 'result': result});
          self.disconnect();
        });
      } else if(data.type === 'module') {
        console.log('RECEIVED (module): ' + data.module + ' - ' + data.repository);
        new Test('tarball', {'repository': data.repository, 'module': data.module}).test(function(result) {
          console.log('DONE (module): ' + data.module + ' - ' + data.repository);
          self.remote.emit('done', {'type': data.type, 'module': data.module, 'result': result});
          self.disconnect();
        });
      }
    });

    socket.once('end', onEnd);
    socket.on('error', onEnd);

    function onEnd() {
      console.log('Disconnected!'.red);
    }

  }).connect(self.port, self.ip);
};


Worker.prototype.disconnect = function () {
  this.socket.end();
};

module.exports = Worker;