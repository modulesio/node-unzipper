module.exports = Extract;

var Parse = require('./parse');
var Writer = require('fstream').Writer;
var util = require('util');
var path = require('path');

util.inherits(Extract, Parse);

function Extract (opts) {
  if (!(this instanceof Extract))
    return new Extract(opts);

  var self = this;

  Parse.call(self,opts);

  let pending = 0;
  let closed = false;
  function pend() {
    pending--;
    tryDone();
  }
  function tryDone() {
    if (pending === 0 && closed) {
      self.emit('done');
    }
  }
  self.on('finish', () => {
    closed = false;
    tryDone();
  });

  self.on('entry', function(entry) {
    if (entry.type == 'Directory') return;
    pending++;
    entry.pipe(Writer({
      path: path.join(opts.path,entry.path)
    }))
    .on('close', () => {
      pending--;
      tryDone();
    })
    .on('error',function(e) {
      pending--;
      tryDone();
      self.emit('error',e);
    });
  });
}
