var util = require('util');
var Job = require('./job');
var extract = require('./extract');

var Selector = {};
Selector.create = function(jobContext, parentContext, selector) {
  var onElement = [];
  var scope = Job.extend(function SelectorScope(cb) {
    onElement.push(cb);
  });
  scope.type = Selector;
  scope.job = jobContext;
  scope.parent = parentContext;
  scope.extractions = [];

  scope.evaluate = function(window) {
    var els = window.document.querySelectorAll(selector);
    if (!els || !els.length) {
      this.emit('notFound:elements');
      return this;
    }
    for (var i = 0, l = els.length; i < l; i++) {
      this.evaluateData(els[i]);
      for (var j = 0, ll = onElement.length; j < ll; j++) {
        onElement[j].call(this, els[i]);
      }
    }
    return this;
  };

  scope.follow = function(pattern) {
    parentContext.follow(pattern);
    return this;
  };

  return scope;
};

module.exports = Selector;
