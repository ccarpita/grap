var util = require('util');
var engline = require('engine');
var EventEmitter = require('events').EventEmitter;
var LinkedList = require('linkedlist');

var Job = function(startUrl) {
  var job = this.job = this;
  this.parent = null;

  this.data = [];
  this.following = {};
  this.following_ordered = [];
  this.selectors = {};
  var engine;

  // Queue must implement 'length' property and the methods 'push' and 'shift'
  var queue = new LinkedList();

  var maxDepth = 0;

  var parallel = 4;
  var crawled = {};
  var numCrawled = 0;
  var numErrors = 0;
  var onStart;
  var started = false;
  var complete = false;

  var pace = 1;
  var paceRand = 0;

  this.getNumCrawled = function getNumCrawled() {
    return numCrawled;
  };

  this.wasCrawled = function wasCrawled(url) {
    return crawled[url];
  };

  this.pace = function(p, r) {
    pace = Number(p);
    if (!pace) {
      pace = 1;
    }
    // TODO: const
    if (pace < 0.01) {
      pace = 0.01;
    }
    if (r > 0) {
      paceRand = r;
    }
  }

  this.start = function() {
    if (!started) {
      started = true;
      if (!engine) {
        engine = new engine.JsDom();
      }
      if (onStart) {
        onStart.apply(job);
      }
      next();
    }
  };

  var next = function() {
    if (complete) {
      return;
    }
    if (queue.length === 0) {
      job.emit('complete');
      complete = true;
    } else {
      var params = queue.shift();
      var url = params[0];
      var context = params[1];
      var depth = params[2];
      fetch(url)
        .then(function(window) {
          crawled[url] = true;
          (context || job).evaluate(window, depth);
          job.emit('crawled', url);
        })
        .catch(function(error) {
          numErrors++;
          job.emit('error', {
            message: error,
            url: url
          });
        })
        .finally(function() {
          setTimeout(next, pace * 1000 + Math.random() * paceRand * 1000);
        });
    }
  };

  /**
   * Get the contents of the url and return a promise
   * to be fulfilled with the DOM.
   */
  var fetch = function(url) {
    if (engine) {
      return engine.get(url);
    } else {
      throw new Error("engine not defined");
    }
  };

  this.queueLink = function(url, context, depth) {
    if (!crawled.hasOwnProperty(url) && (!maxDepth || depth <= maxDepth)) {
      crawled[url] = false;
      queue.push([url, context || job, depth]);
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
    return this;
  };

  this.parallel = function(p) {
    if (typeof p === 'undefined') {
      return parallel;
    } else {
      parallel = p;
      return this;
    }
  };

  this.depth = function(depth) {
    if (typeof depth === 'undefined') {
      return maxDepth;
    } else {
      maxDepth = Number(depth);
      return this;
    }
  };


  this.onOutput = function(data) {
    console.log.apply(null, data);
  };

  this.output = function(cb) {
    this.onOutput = cb;
  };

  return function JobClosure(cb) {
    onStart = cb;
    if (started) {
      onStart.apply(job);
    }
  };
};
util.inherits(Job, EventEmitter);

var Follow = require('./follow');
var Selector = require('./selector');

Job.prototype.follow(pattern) {
  if (!this.following[pattern]) {
    var follow = new Follow(this.job, this, pattern);
    this.following[pattern] = follow;
    this.following_ordered.push(follow);
  }
  return this.following[pattern];
};

Job.prototype.each(selector) {
  if (!this.selectors[selector]) {
    var sel = new Selector(this.job, this, selector);
    this.selectors[selector] = sel;
  }
  return this.selectors[selector];
};

Job.prototype.push = function() {
  var data = [].slice(arguments);
  this.job.onOutput(data);
  this.job.emit('data', data);
};

Job.prototype.evaluateSelectors = function(window) {
  for (var sel in this.selectors) {
    this.selectors[sel].evaluate(window);
  }
};

Job.prototype.end = function() {
  if (this.parent) {
    return this.parent;
  }
  return this;
};

Job.prototype.evaluateFollowing = function(window, depth) {
  for (var i = 0, l = this.following_ordered; i < l; i++) {
    this.following_ordered[i].evaluate(window, depth);
  }
};

Job.prototype.evaluateData = function(window) {
  if (this.pushArguments && this.pushArguments.length) {
    this.job.push(extract(this.pushArguments, window.document));
  }
};

Job.prototype.evaluate = function(window, depth) {
  depth = depth || 1;
  this.evaluateData();
  this.evaluateSelectors(window, depth);
  this.evaluateFollowing(window, depth);
};

module.exports = Job;
