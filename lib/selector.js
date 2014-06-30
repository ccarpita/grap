var util = require('util');
var Job = require('./job');
var extract = require('./extract');

var Selector = {};
Selector.create = function(jobContext, parentContext, selector) {
  var onElement = [];
  var closure = Job.extend(function SelectorClosure(cb) {
    onElement.push(cb);
  });
  closure.type = Selector;
  closure.job = jobContext;
  closure.parent = parentContext;
  closure.extractions = [];
  closure.evaluate = function(window) {
    var els = window.document.querySelectorAll(selector);
    if (!els) {
      this.emit('elementsNotFound');
      return;
    }
    for (var i = 0, l = els.length; i < l; i++) {
      if (this.extractions.length > 0) {
        jobContext.push(extract(closure.extractions, els[i]));
      }
      for (var j = 0, ll = onElement.length; j < ll; j++) {
        onElement[j].call(closure, els[i]);
      }
    }
  };

  closure.follow = function(pattern) {
    parentContext.follow(pattern);
    return this;
  };

  return closure;
};

module.exports = Selector;
