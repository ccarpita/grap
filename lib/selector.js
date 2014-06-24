var util = require('util');
var Job = require('./job');
var extract = require('./extract');

function Selector(jobContext, parentContext, selector) {
  this.job = jobContext;
  this.parent = parentContext;
  this.extractions = [];
  var onElement = [];
  var sel = this;
  this.evaluate = function(window) {
    var els = window.document.querySelectorAll(selector);
    for (var i = 0, l = els.length; i < l; i++) {
      if (this.pushArguments.length > 0) {
        sel.job.push(extract(sel.extractions, els[i]));
      }
      for (var j = 0, ll = onElement.length; j < ll; j++) {
        onElement[j].call(sel, els[i]);
      }
    }
  };
  return function SelectorClosure(cb) {
    onElement.push(cb);
  };
};

Selector.prototype.extract = function() {
  this.extractions = [].slice(arguments);
  return this;
};

Selector.prototype.follow = function(pattern) {
  this.job.follow(pattern);
  return this;
};

util.inherits(Selector, Job);
