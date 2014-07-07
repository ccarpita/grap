var util = require('util');

var Job = require('./job');

var Follow = {
  name: 'Follow'
};

Follow.create = function FollowCreate(jobContext, parentContext, pattern) {
  var onEval = [];

  var scope = Job.extend(function FollowScope(cb) {
    onEval.push(cb);
  });
  scope.type = Follow;

  scope.job = jobContext;
  scope.parent = parentContext;
  scope.pattern = pattern;

  scope.evaluate = function followEvaluate(window, context, depth) {
    this.evaluateData(window);
    this.evaluateSelectors(window);
    this.evaluateLinks(window, depth);

    // Evaluate nested following scopes after current link evaluation,
    // since we will prefer to process the document with the highest
    // level parent context.
    this.evaluateFollowing(window);

    // Execute attached handlers
    for (var i = 0, l = onEval.length; i < l; i++) {
      onEval[i].call(this, window);
    }
  };

  scope.evaluateLinks = function evaluateLinks(window, depth) {
    // Evaluate logic for Follow class
    var links = scope.getLinks(window);
    for (var j = 0, ll = links.length; j < ll; j++) {
      this.job.queueLink(links[j], this, depth + 1);
    }
  };

  scope.getLinks = function getLinks(window) {
    var links = window.document.getElementsByTagName('a');
    var m = [];
    var seen = {};
    for (var i = 0, l = links.length; i < l; i++) {
      if (links[i].href && pattern.test(links[i].href) && !seen[links[i].href]) {
        seen[links[i].href] = true;
        m.push(links[i].href);
      }
    }
    return m;
  };

  return scope;
};

module.exports = Follow;
