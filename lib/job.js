var util = require('util');
var EventEmitter = require('events').EventEmitter;

var LinkedList = require('./linkedlist');
var Engine = require('./engine');
var extract = require('./extract');

var Follow;
var Selector;

// Extend crawling entities with common methods
var extend = function(closure) {

  closure.data = [];
  closure.following = {};
  closure.following_ordered = [];
  closure.selectors = {};
  closure.pushArguments = [];

  closure.follow = function(pattern) {
    if (!this.following[pattern]) {
      var follow = new Follow(this.job, this, pattern);
      this.following[pattern] = follow;
      this.following_ordered.push(follow);
    }
    return this.following[pattern];
  };

  closure.each = function(selector) {
    if (!this.selectors[selector]) {
      var sel = new Selector(this.job, this, selector);
      this.selectors[selector] = sel;
    }
    return this.selectors[selector];
  };

  closure.push = function() {
    var data = [].slice(arguments);
    this.job.onOutput(data);
    this.job.emit('data', data);
    return this;
  };

  closure.evaluateSelectors = function(window) {
    for (var sel in this.selectors) {
      this.selectors[sel].evaluate(window);
    }
  };

  closure.end = function() {
    if (this.parent) {
      return this.parent;
    }
    return this;
  };

  closure.evaluateFollowing = function(window, depth) {
    for (var i = 0, l = this.following_ordered; i < l; i++) {
      this.following_ordered[i].evaluate(window, depth);
    }
  };

  closure.evaluateData = function(window) {
    if (this.pushArguments && this.pushArguments.length) {
      this.job.push(extract(this.pushArguments, window.document));
    }
  };

  closure.evaluate = function(window, depth) {
    depth = depth || 1;
    this.evaluateData();
    this.evaluateSelectors(window, depth);
    this.evaluateFollowing(window, depth);
  };

  var listeners = {};
  closure.emit = function() {
    var args = [].slice(arguments);
    var type = args.shift();
    if (listeners[type]) {
      for (var i = 0, l = listeners[type].length; i < l; i++) {
        setTimeout(function() {
          listeners[type][i].apply(null, args);
        }, 0);
      }
    }
    return this;
  };
  closure.on = function(type, fn) {
    (listeners[type] = listeners[type] || []).push(fn);
    return this;
  };

  return closure;
};

function Job(startUrl) {

  var engine;

  // Queue must implement 'length' property and the methods 'push' and 'shift'
  var queue = new LinkedList();
  queue.push(startUrl);

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

  /**
   * @private
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

  var closure = function JobClosure(cb) {
    onStart = cb;
    if (started) {
      onStart.apply(job);
    }
  }


  closure.getNumCrawled = function getNumCrawled() {
    return numCrawled;
  };

  closure.wasCrawled = function wasCrawled(url) {
    return crawled[url];
  };

  closure.pace = function(p, r) {
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

  closure.start = function() {
    if (!started) {
      started = true;
      if (!engine) {
        engine = new Engine.JsDom();
      }
      if (onStart) {
        onStart.apply(job);
      }
      next();
    }
  };

  closure.queueLink = function(url, context, depth) {
    if (!crawled.hasOwnProperty(url) && (!maxDepth || depth <= maxDepth)) {
      crawled[url] = false;
      queue.push([url, context || job, depth]);
    }
  };

  closure.browser = function(id) {
    if (typeof id === 'object' && id instanceof Engine) {
      engine = id;
    } else if (id === 'jsdom') {
      engine = new Engine.JsDom();
    } else if (id === 'phantom') {
      engine = new Engine.Phantom();
    } else {
      throw new Error("Browser must be one of: jsdom, phantom");
    }
    return closure;
  };

  closure.parallel = function(p) {
    if (typeof p === 'undefined') {
      return parallel;
    } else {
      parallel = p;
      return this;
    }
  };

  closure.depth = function(depth) {
    if (typeof depth === 'undefined') {
      return maxDepth;
    } else {
      maxDepth = Number(depth);
      return this;
    }
  };

  closure.onOutput = function(data) {
    console.log.apply(null, data);
  };

  closure.output = function(cb) {
    this.onOutput = cb;
  };

  extend(closure);
  closure.parent = null;
  closure.job = closure;

  return closure;
};
Job.extend = extend;

module.exports = Job;
Follow = require('./follow');
Selector = require('./selector');
