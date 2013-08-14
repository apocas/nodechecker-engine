var dnode = require('dnode'),
  Test = require('nodechecker-tester'),
  Dispatcher = require('./dispatcher')
  Runner = require('./runner');

var Server = function(port) {
  this.dispatcher = new Dispatcher();
  this.port = port || 5004;
};


Server.prototype.run = function() {
  var self = this;

  this.dispatcher.start(function () {
    self.init();
  });

  console.log('Server started!');
};

Server.prototype.init = function () {
  var self = this;

  this.dnode_server = dnode({
    testRepo: function (repo, branch, cb) {
      var runt = new Runner('repo', {'repository': repo, 'branch': branch});
      runt.on('finished', function (result) {
        console.log('DONE ' + repo);
        cb(result);
      });
      self.dispatcher.dispatch(runt);
    },

    testModule: function (module, repository, cb) {
      var runt = new Runner('tarball', {'repository': repository, 'module': module});
      runt.on('finished', function (result) {
        console.log('DONE ' + module);
        cb(result);
      });
      self.dispatcher.dispatch(runt);
    }
  });

  this.dnode_server.listen(this.port);
};

module.exports = Server;
