var Server = require('./lib/server'),
  dnode = require('dnode');

if(process.argv.length < 4) {
  console.log('main.js source_ip balancer_ip');
  process.exit(1);
}

var server = new Server();
server.run();

var d = dnode.connect(5004, process.argv[3]);
d.on('remote', function (remote) {
  remote.addMe(process.argv[2], 5004, function () {
    d.end();
  });
});