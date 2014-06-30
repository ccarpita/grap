var util = require('util');

var Job = require('./job');

var Follow = {}
Follow.create = function(jobContext, parentContext, pattern) {
  var onEval = [];

  var closure = Job.extend(function FollowClosure(cb) {
    onEval.push(cb);
  });
  closure.type = Follow;

  closure.job = jobContext;
  closure.parent = parentContext;
  closure.pattern = pattern;

  closure.evaluate = function(window, context, depth) {
    this.evaluateData(window);
    this.evaluateSelectors(window);

    // Evaluate logic for Follow class
    var links = closure.getLinks(window);
    for (var j = 0, ll = links.length; j < ll; j++) {
      this.job.queueLink(links[i], this, depth + 1);
    }

    // Evaluate sub-closures after current follow evaluation,
    // since we will prefer to match the highest level parent context.
    this.evaluateFollowing(window);

    for (var i = 0, l = onEval.length; i < l; i++) {
      onEval[i].call(this, window);
    }
  };

  closure.getLinks = function(window) {
    var links = window.document.getElementsByTagName('a');
    var m = [];
    for (var i = 0, l = links.length; i < l; i++) {
      if (links[i].href && pattern.test(links[i].href)) {
        m.push(links[i]);
      }
    }
    return m;
  };

  return closure;
};

module.exports = Follow;
