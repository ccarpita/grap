var util = require('util');

var Job = function(startUrl){
  var job = this.job = this;

  this.data = [];
  this.following = {};
  this.following_ordered = [];
  this.selectors = {};
  var engine;
  var queue = [];

  var crawled = {};
  var numCrawled = 0;
  var onStart;
  var started = false;

  this.getNumCrawled = function getNumCrawled() {
    return numCrawled;
  };

  this.wasCrawled = function wasCrawled(url) {
    return crawled[url];
  };

  this.start = function() {
    if (!started) {
      started = true;
      if (!engine) {
        engine = new JsDom();
      }
      if (onStart) {
        onStart.apply(job);
      }
      // start crawling
    }
  };

  /**
   * Get the contents of the url and return a promise
   * to be fulfilled with the DOM.
   */
  this.get = function(url) {
    if (engine) {
      return engine.get(url);
    } else {
      throw new Error("engine not defined");
    }
  };

  this.queueLink = function(url) {
    if (!crawled[url]) {
      queue.push(url);
    }
  };

  this.browser = function(id) {
    if (id === 'jsdom') {
      engine = new Engine.JsDom();
    } else if (id === 'phantom') {
      engine = new Engine.Phantom();
    } else {
      throw new Error("Browser must be one of: jsdom, phantom");
    }
  };

  return function JobClosure(cb) {
    onStart = cb;
    if (started) {
      onStart.apply(job);
    }
  };
};

var Follow = require('./follow');
var Selector = require('./selector');

Job.prototype.follow(pattern) {
  if (!this.job.following[pattern]) {
    var follow = new Follow(this.job, pattern);
    this.job.following[pattern] = follow;
    this.job.following_ordered.push(follow);
  }
  return this.job.following[pattern];
};

Job.prototype.each(selector) {
  if (!this.selectors[selector]) {
    var sel = new Selector(this.job, selector);
    this.selectors[selector] = sel;
  }
  return this.selectors[selector];
};

Job.prototype.push = function() {
  this.job.data.push(arguments);
};

Job.prototype.evaluateSelectors = function(document) {
  for (var sel in this.selectors) {
    this.selectors[sel].evaluate(document);
  }
};

Job.prototype.evaluate = function(document) {
  this.evaluateSelectors(document);
  for (var i = 0, l = this.following_ordered; i < l; i++) {
    this.following_ordered[i].evaluate(document);

    follow.evaluate(document);
  }
};

module.exports = Job;
