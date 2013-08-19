var Server = require('./lib/server'),
  dnode = require('dnode');


var port = 5005;
var server = new Server(port);
server.run();


if(process.argv.length >= 4) {
  var d = dnode.connect(5004, process.argv[3]);
  d.on('remote', function (remote) {
    remote.addMe(process.argv[2], port, function () {
      d.end();
    });
  });

  process.on('SIGINT', function () {
    d.end();
  });
}
