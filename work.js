var Worker = require('./lib/worker');
var port = process.env.BALANCER_PORT || 5005;
var ip = process.env.BALANCER_HOST || "127.0.0.1";

new Worker(ip, port).connect();
