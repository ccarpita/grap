var util = require('util');
var Job = require('./job');

function Selector(jobContext, selector) {
  this.job = jobContext;
  this.pushArguments = [];
  var onElement = function onElement() {

  };
  var sel = this;
  this.evaluate = function(document) {
    var els = document.querySelectorAll(selector);
    for (var i = 0, l = els.length; i < l; i++) {
      if (onElement) {
        onElement.call(sel, els[i]);
      }
    }
  };
  return function SelectorClosure(cb) {
    onElement = cb;
  };
};

Selector.prototype.push = function() {
  this.pushArguments = [].slice(arguments);
};

util.inherits(Selector, Job);
