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
    var defaultBaseUrl = 'http://localhost:8080';
    var defaultPace = 0.001;

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
      var html = '<div class="content"><span class="a">One</span><span class="b">Two</span>';
      return crawlTest(html, function() {
        this.each('span')
          .extract('$text');
      }, function(data) {
        expect(data.length).to.equal(2);
        expect(data[0][0]).to.equal('One');
        expect(data[1][0]).to.equal('Two');
      });
    });

    it('Should follow links and extract data in subsequent pages', function() {
      var htmlContent = {};
      htmlContent[defaultBaseUrl] = '<ul id="content" class="links"><li><span class="answer"><a href="http://localhost:8080/foo">Link to Answer</a></span></li></ul>';
      htmlContent['http://localhost:8080/foo'] = '<div id="content"><span class="answer">Hello World</span></div>';
      return crawlTest(htmlContent, function() {
        this.follow(/\/foo/)
          .each('#content span.answer')
            .extract('$text');
      }, function(data) {
        // check length == 1 to assert that `each` only applies to `follow` context
        expect(data.length).to.equal(1);
        expect(data[0][0]).to.equal('Hello World');
      });
    });

    function extractTest(html, extract, assertValue) {
      return crawlTest(html, function() { this.extract(extract); }, assertValue);
    }

    function crawlTest(html, businessLogic, assertion) {
      return when.promise(function(resolve, reject) {
        if (typeof html === 'string') {
          mockEngine.setUrlContent(defaultBaseUrl, html);
        } else if (typeof html === 'object') {
          for (var url in html) {
            if (html.hasOwnProperty(url)) {
              mockEngine.setUrlContent(url, html[url]);
            }
          }
        }
        var captureData = [];
        var assertValue;
        if (typeof assertion !== 'function') {
          assertValue = assertion;
          assertion = function() {
            expect(captureData.length).to.equal(1);
            expect(captureData[0][0]).to.equal(assertValue);
          };
        }

        var job = crawl(defaultBaseUrl);
        job.pace(defaultPace);
        businessLogic.apply(job);
        job.pipe(function(data) {
          captureData.push(data);
        })
        .on('error', function(error) {
          console.error('[Crawl Error]', error);
        })
        .on('complete', function() {
          try {
            assertion(captureData);
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });
    }

  });
});
