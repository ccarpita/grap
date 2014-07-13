
var expect = require('chai').expect;
var jsdom = require('jsdom');
var Selector = require('../../lib/selector');

describe('Selector', function() {

  var jobContext, parentContext;

  it('Should create a selector which will evaluate data for matching elements', function(done) {
    var html = '<div><span>Foo</span></div>';
    jsdom.env(html, [], function(error, window) {
      var selector = Selector.create(jobContext, parentContext, "span");
      selector(function(el) {
        expect(el.tagName).to.equal('SPAN');
        done();
      });
      selector.evaluate(window);
    });
  });

  it('Should bubble follow directives to its parent context', function(done) {
    var selector = Selector.create(jobContext, parentContext, "span");
    var testPattern = /foo/;
    parentContext.follow = function(pattern) {
      expect(pattern).to.equal(testPattern);
      done();
    };
    selector.follow(testPattern);
  });

  beforeEach(function() {
    jobContext = {};
    parentContext = {};
  });
});
