var util = require('util');
var Job = require('./job');
var extract = require('./extract');

function Selector(jobContext, parentContext, selector) {
  var onElement = [];
  var closure = Job.extend(function SelectorClosure(cb) {
    onElement.push(cb);
  });
  closure.job = jobContext;
  closure.parent = parentContext;
  closure.extractions = [];
  closure.evaluate = function(window) {
    var els = window.document.querySelectorAll(selector);
    for (var i = 0, l = els.length; i < l; i++) {
      if (this.pushArguments.length > 0) {
        jobContext.push(extract(sel.extractions, els[i]));
      }
      for (var j = 0, ll = onElement.length; j < ll; j++) {
        onElement[j].call(sel, els[i]);
      }
    }
  };

  closure.extract = function() {
    this.extractions = Array.prototype.slice.call(arguments);
    return this;
  };

  closure.follow = function(pattern) {
    parentContext.follow(pattern);
    return this;
  };

  return closure;
};


