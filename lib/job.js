var util = require('util');
var LinkedList = require('linkedlist');

var Engine = require('./engine');
var extract = require('./extract');

var Follow;
var Selector;
var Job = {};

function slice(args) {
  return Array.prototype.slice.call(args);
}

// Extend crawling entities with common methods
Job.extend = function JobExtend(scope) {

  scope.data = [];
  scope.following = {};
  scope.following_ordered = [];
  scope.selectors = {};
  scope.extractions = [];

  scope.follow = function(pattern) {
    if (!this.following[pattern]) {
      var follow = Follow.create(this.job, this, pattern);
      this.following[pattern] = follow;
      this.following_ordered.push(follow);
    }
    return this.following[pattern];
  };

  scope.each = function(selector) {
    if (!this.selectors[selector]) {
      var sel = Selector.create(this.job, this, selector);
      this.selectors[selector] = sel;
    }
    return this.selectors[selector];
  };

  scope.push = function() {
    this.job.push.apply(this.job, arguments);
    return this;
  };

  scope.evaluateSelectors = function(window) {
    for (var sel in this.selectors) {
      if (this.selectors.hasOwnProperty(sel)) {
        this.selectors[sel].evaluate(window);
      }
    }
    return this;
  };

  scope.extract = function() {
    this.extractions.push(slice(arguments));
    return this;
  };

  scope.end = function() {
    if (this.parent) {
      return this.parent;
    }
    return this;
  };

  scope.evaluateFollowing = function(window, depth) {
    for (var i = 0, l = this.following_ordered.length; i < l; i++) {
      this.following_ordered[i].evaluateLinks(window, depth);
    }
  };

  scope.evaluateData = function(element) {
    if (this.extractions.length > 0) {
      for (var i = 0, l = this.extractions.length; i < l; i++) {
        var data = extract(this.extractions[i], element);
        if (data) {
          this.push.apply(this, data);
        } else {
          this.emit('notFound:data');
        }
      }
    }
  };

  scope.evaluate = function(window, depth) {
    depth = depth || 1;
    this.evaluateData(window.document);
    this.evaluateSelectors(window, depth);
    this.evaluateFollowing(window, depth);
  };

  // We can't extend a function with EventEmitter,
  // so we implement emit/on here.
  var listeners = {};
  scope.emit = function() {
    var args = slice(arguments);
    var type = args.shift();
    if (listeners[type]) {
      var deferListener = function(index) {
        process.nextTick(function publishToListener() {
          listeners[type][index].apply(null, args);
        });
      };
      for (var i = 0, l = listeners[type].length; i < l; i++) {
        deferListener(i);
      }
    }
    return scope;
  };
  scope.on = function(type, fn) {
    (listeners[type] = listeners[type] || []).push(fn);
    return scope;
  };
  return scope;
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
  var paceRand = 0;

  /**
   * @private
   * Create a closure which will act as the crawl job handle.
   */
  var scope = Job.extend(function JobScope(cb) {
    onStart = cb;
    if (started) {
      onStart.apply(scope);
    }
  });
  scope.type = Job;
  queue.push([startUrl, scope, 0]);

  /**
   * @private
   * Get the contents of the url and return a promise
   * to be fulfilled with the DOM.
   */
  var fetch = function fetch(url) {
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
  var next = function next() {
    if (complete) {
      return;
    }
    if (queue.length === 0) {
      scope.emit('complete');
      complete = true;
    } else {
      var params = queue.shift();
      var url = params[0];
      var context = params[1];
      var depth = params[2];
      fetch(url)
        .then(function(window) {
          crawled[url] = true;
          numCrawled++;
          (context || scope).evaluate(window, depth);
          scope.emit('crawled', url);
        })
        .catch(function(error) {
          numErrors++;
          scope.emit('error', {
            message: error,
            url: url,
            stack: error.stack
          });
        })
        .finally(function() {
          if (queue.length === 0) {
            next();
          } else {
            setTimeout(next, pace * 1000 + Math.random() * paceRand * 1000);
          }
        });
    }
  };

  /**
   * Default data pipe logs to stdout.
   */
  var onPipe = function onPipe(data) {
    console.log.apply(null, data);
  };

  scope.getNumCrawled = function getNumCrawled() {
    return numCrawled;
  };

  scope.wasCrawled = function wasCrawled(url) {
    return crawled[url];
  };

  /**
   * Set the pace of crawling for this job.
   * @param {Number} p Pace to crawl at, in seconds between fetches. Default = 1
   * @param {Number} r Random variation of pace rate.  Default = 0.333
   */
  scope.pace = function(p, r) {
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
    return scope;
  };

  scope.start = function() {
    if (!started) {
      started = true;
      if (!engine) {
        engine = new Engine.JsDom();
      }
      if (onStart) {
        onStart.apply(scope);
      }
      next();
    }
    return scope;
  };

  /**
   * Queue a link to crawl, and associate with a context.
   */
  scope.queueLink = function(url, context, depth) {
    if (!crawled.hasOwnProperty(url) && (!maxDepth || depth <= maxDepth)) {
      crawled[url] = false;
      queue.push([url, context || scope, depth]);
    }
    return scope;
  };

  /**
   * @public
   * Set browser engine to use for crawling.
   */
  scope.browser = function(id) {
    if (typeof id === 'object' && id instanceof Engine) {
      engine = id;
    } else if (id === 'jsdom') {
      engine = new Engine.JsDom();
    } else if (id === 'phantom') {
      engine = new Engine.Phantom();
    } else {
      throw new Error("Browser must be one of: jsdom, phantom");
    }
    return scope;
  };

  /**
   * Set maximum crawl depth.
   * @param {Number} depth Number of levels of links to follow.
   */
  scope.depth = function(depth) {
    if (typeof depth === 'undefined') {
      return maxDepth;
    } else {
      maxDepth = Number(depth);
      return scope;
    }
  };

  /**
   * Override default data handler
   */
  scope.pipe = function(cb) {
    onPipe = cb;
    return scope;
  };

  /**
   * Push extracted data onto the buffer
   */
  scope.push = function() {
    onPipe(slice(arguments));
    return scope;
  };

  scope.parent = null;
  scope.job = scope;

  return scope;
};

module.exports = Job;
Follow = require('./follow');
Selector = require('./selector');
