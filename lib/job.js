var util = require('util');

var LinkedList = require('./linkedlist');
var Engine = require('./engine');
var extract = require('./extract');

var Follow;
var Selector;
var Job = {};

// Extend crawling entities with common methods
Job.extend = function(closure) {

  var slice = function(args) {
    return Array.prototype.slice.call(args);
  };
  closure.data = [];
  closure.following = {};
  closure.following_ordered = [];
  closure.selectors = {};
  closure.extractions = [];

  closure.follow = function(pattern) {
    if (!this.following[pattern]) {
      var follow = Follow.create(this.job, this, pattern);
      this.following[pattern] = follow;
      this.following_ordered.push(follow);
    }
    return closure;
  };

  closure.each = function(selector) {
    if (!this.selectors[selector]) {
      var sel = Selector.create(this.job, this, selector);
      closure.selectors[selector] = sel;
    }
    return closure;
  };

  closure.push = function() {
    var data = slice(arguments);
    closure.job.push(data);
    return closure;
  };

  closure.evaluateSelectors = function(window) {
    for (var sel in this.selectors) {
      closure.selectors[sel].evaluate(window);
    }
    return closure;
  };

  closure.extract = function() {
    closure.extractions.push(slice(arguments));
    return closure;
  };

  closure.end = function() {
    if (closure.parent) {
      return closure.parent;
    }
    return closure;
  };

  closure.evaluateFollowing = function(window, depth) {
    for (var i = 0, l = this.following_ordered; i < l; i++) {
      closure.following_ordered[i].evaluate(window, depth);
    }
  };

  closure.evaluateData = function(window) {
    if (closure.extractions.length > 0) {
      for (var i = 0, l = closure.extractions.length; i < l; i++) {
        var data = extract(closure.extractions[i], window.document);
        if (data) {
          closure.job.push(data);
        } else {
          closure.emit('notFound:data');
        }
      }
    }
  };

  closure.evaluate = function(window, depth) {
    depth = depth || 1;
    closure.evaluateData(window);
    closure.evaluateSelectors(window, depth);
    closure.evaluateFollowing(window, depth);
  };

  // We can't extend a function with EventEmitter,
  // so we implement emit/on here.
  var listeners = {};
  closure.emit = function() {
    var args = slice(arguments);
    var type = args.shift();
    if (listeners[type]) {
      for (var i = 0, l = listeners[type].length; i < l; i++) {
        (function(index) {
          process.nextTick(function() {
            listeners[type][index].apply(null, args);
          });
        })(i);
      }
    }
    return closure;
  };
  closure.on = function(type, fn) {
    (listeners[type] = listeners[type] || []).push(fn);
    return closure;
  };

  return closure;
};

Job.create = function(startUrl) {

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
  var paceRand = 0.333;

  /**
   * @private
   * Create a closure which will act as the crawl job handle.
   */
  var closure = function JobClosure(cb) {
    onStart = cb;
    if (started) {
      onStart.apply(job);
    }
  };
  Job.extend(closure);
  queue.push([startUrl, closure, 0]);

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

  /**
   * @private
   * Dequeue a link and attempt to retrieve the html
   * and extract data.
   */
  var next = function() {
    if (complete) {
      return;
    }
    if (queue.length === 0) {
      closure.emit('complete');
      complete = true;
    } else {
      var params = queue.shift();
      var url = params[0];
      var context = params[1];
      var depth = params[2];
      fetch(url)
        .then(function(window) {
          crawled[url] = true;
          (context || closure).evaluate(window, depth);
          closure.emit('crawled', url);
        })
        .catch(function(error) {
          numErrors++;
          closure.emit('error', {
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
   * Default data pipe logs to stdout.
   */
  var onPipe = function(data) {
    console.log.apply(null, data);
  };

  closure.getNumCrawled = function getNumCrawled() {
    return numCrawled;
  };

  closure.wasCrawled = function wasCrawled(url) {
    return crawled[url];
  };

  /**
   * Set the pace of crawling for this job.
   * @param {Number} p Pace to crawl at, in seconds between fetches. Default = 1
   * @param {Number} r Random variation of pace rate.  Default = 0.333
   */
  closure.pace = function(p, r) {
    pace = Number(p);
    if (!pace) {
      pace = 1;
    }
    // TODO: const
    if (pace < 0.01) {
      pace = 0.01;
    }
    if (typeof r === 'number') {
      paceRand = r;
    }
    return closure;
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
    return closure;
  };

  /**
   * Queue a link to crawl, and associate with a context.
   */
  closure.queueLink = function(url, context, depth) {
    if (!crawled.hasOwnProperty(url) && (!maxDepth || depth <= maxDepth)) {
      crawled[url] = false;
      queue.push([url, context || closure, depth]);
    }
    return closure;
  };

  /**
   * @public
   * Set browser engine to use for crawling.
   */
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

  /**
   * Set maximum crawl depth.
   * @param {Number} depth Number of levels of links to follow.
   */
  closure.depth = function(depth) {
    if (typeof depth === 'undefined') {
      return maxDepth;
    } else {
      maxDepth = Number(depth);
      return closure;
    }
  };

  /**
   * Override default data handler
   */
  closure.pipe = function(cb) {
    onPipe = cb;
    return closure;
  };

  /**
   * Push extracted data onto the buffer
   */
  closure.push = function(data) {
    onPipe(data);
    return closure;
  };

  closure.parent = null;
  closure.job = closure;

  return closure;
};

module.exports = Job;
Follow = require('./follow');
Selector = require('./selector');
