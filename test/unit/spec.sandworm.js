var sw = require('sandworm');
var when = require('when');
var expect = require('expect.js');
var mockContent = require('../mock/content');
var engine = require('sandworm/engine');
var sinon = require('sinon');

describe('Sandworm Library', function() {

  var mockUrl = 'http://www.foobar.com';
  var mockEngine = new engine.Mock();

  before(function() {
    for (var url in mockContent) {
      mockEngine.setUrlContent(url, mockContent[url]);
    }
  });

  function startCrawl(url) {
    return sw.crawl(url).engine(mockEngine);
  };

  describe('Crawling', function() {

    it('Should handle a trivial single-page crawl with a push declaration', function() {
      return when.promise(function(resolve, reject) {
        var url = 'http://localhost:8080';
        mockEngine.setUrlContent(url, '<a class="title">Hello World</a>');
        startCrawl(url)
          .on('data', function(data) {
            expect(data[0].to.be(url));
          })
          .push('a.title $text');
      });
    });

    it('Should create a page object with content when start is called', function(done) {
      dw.crawl(mockUrl, function(page) {
        expect(page).to.be.a(Page);
        expect(page.window).to.be.an(Object);
        expect(page.document).to.be.an(Object);
        done();
      });
    });
  });
});
