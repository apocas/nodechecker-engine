var Server = require('./lib/server'),
  dnode = require('dnode');

if(process.argv.length < 4) {
  console.log('main.js source_ip balancer_ip');
  process.exit(1);
}

var port = 5005;
var server = new Server(port);
server.run();

var d = dnode.connect(5004, process.argv[3]);
d.on('remote', function (remote) {
  remote.addMe(process.argv[2], port, function () {
    d.end();
  });
});