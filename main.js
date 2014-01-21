var cp = require('child_process');

var childs = [];
var procs = process.env.PROCS || 6;

for (var i = procs; i > 0; i--) {
  childs.push(cp.fork('./work'));
}
