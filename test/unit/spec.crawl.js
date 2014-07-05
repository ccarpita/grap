var sw = require('../../lib/sandworm');
var when = require('when');
var expect = require('expect.js');
var mockContent = require('../mock/content');
var engine = require('../../lib/engine');
//var sinon = require('sinon');

describe('Sandworm Library', function() {

  var mockUrl = 'http://www.foobar.com';
  var mockEngine = new engine.Mock();

  before(function() {
    for (var url in mockContent) {
      mockEngine.setUrlContent(url, mockContent[url]);
    }
  });

  function crawl(url) {
    return sw.crawl(url).browser(mockEngine);
  }

  describe('Crawling', function() {

    // Jsdom eval can be expensive
    this.timeout(10000);
    this.slow(2000);

    it('Should perform a trivial crawl with an extract declaration', function() {
      return extractTest(
        '<a class="title">Hello World</a>',
        'a.title $text',
        'Hello World');
    });

    it('Should extract html content using selector', function() {
      return extractTest(
        '<span class="foo"><a name="bar">baz</a></span>',
        'span.foo $html',
        '<a name="bar">baz</a>');
    });

    it('Should extract attribute content using selector', function() {
      return extractTest(
        '<div id="a" class="content"><span id="b" data-id="foo"></span></div>',
        'div span $attr:data-id',
        'foo');
    });

    it('Should iterate over elements provided by each clause', function() {
      return when.promise(function(resolve, reject) {
        var url = 'http://localhost:8080';
        var html = '<div class="content"><span class="a">One</span><span class="b">Two</span>';
        mockEngine.setUrlContent(url, html);
        var captureData = [];
        crawl(url)
        .each('span')
          .extract('$text')
        .end()
        .pipe(function(data) {
          captureData.push(data);
        })
        .on('complete', function() {
          try {
            expect(captureData).to.be.an('array');
            expect(captureData.length).to.equal(2);
            expect(captureData[0][0]).to.equal('One');
            expect(captureData[1][0]).to.equal('Two');
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });
    });

    function extractTest(html, extract, value) {
      return when.promise(function(resolve, reject) {
        var url = 'http://localhost:8080';
        mockEngine.setUrlContent(url, html);
        var captureData = null;
        crawl(url)
        .extract(extract)
        .pipe(function(data) {
          captureData = data;
        })
        .on('complete', function() {
          expect(captureData).to.be.an('array');
          expect(captureData.length).to.equal(1);
          expect(captureData[0]).to.equal(value);
          resolve();
        });
      });
    }

  });
});
