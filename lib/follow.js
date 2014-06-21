var Job = require('./job');
function Follow(jobContext, pattern) {
  this.job = jobContext;
  this.selectors = {};
  this.pattern = pattern;
  this.pushArguments = [];
  var follow = this;
  var onPage = null;
  return function(cb) {
    onPage = cb;
  }
};
util.inherits(Follow, Job);

Follow.prototype.getLinks(document) {
  var links = document.getElementsByTagName('a');
  var m = [];
  for (var i = 0, l = links.length; i < l; i++) {
    if (links[i].href && pattern.test(links[i].href)) {
      m.push(links[i]);
    }
  }
  return m;
};

Follow.prototype.push = function() {
  this.pushArguments = [].slice(arguments);
};

Follow.prototype.evaulate = function(document) {
  this.evaluateSelectors(document);
  var links = follow.getLinks(document);
  for (var j = 0, ll = links.length; j < ll; j++) {
    this.job.queueLink(links[i]);
  }

};

