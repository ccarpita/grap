var Job = require('./job');
function Follow(jobContext, parentContext, pattern) {
  this.job = jobContext;
  this.parent = parentContext;
  this.selectors = {};
  this.following = {};
  this.following_ordered = [];
  this.pattern = pattern;
  this.pushArguments = [];
  var follow = this;
  var onEval = [];

  this.evaulate = function(window, context, depth) {
    this.evaluateSelectors(window);
    var links = follow.getLinks(window);
    for (var j = 0, ll = links.length; j < ll; j++) {
      this.job.queueLink(links[i], this, depth + 1);
    }
    this.evaluateFollowing(window);
    for (var i = 0, l = onEval.length; i < l; i++) {
      onEval[i].call(this, window);
    }
  };
  return function(cb) {
    onEval.push(cb);
  }
};
util.inherits(Follow, Job);

Follow.prototype.getLinks(window) {
  var links = window.document.getElementsByTagName('a');
  var m = [];
  for (var i = 0, l = links.length; i < l; i++) {
    if (links[i].href && pattern.test(links[i].href)) {
      m.push(links[i]);
    }
  }
  return m;
};

Follow.prototype.extract = function() {
  this.extractions = [].slice(arguments);
};

