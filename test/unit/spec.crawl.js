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

    it('Should handle a trivial single-page crawl with a push declaration', function() {
      return when.promise(function(resolve, reject) {
        var url = 'http://localhost:8080';
        mockEngine.setUrlContent(url, '<a class="title">Hello World</a>');
        var captureData = null;

        crawl(url)
          .extract('a.title $text')
        .end()
        .pipe(function(data) {
          captureData = data;
        })
        .on('complete', function() {
          expect(captureData).to.be.an('array');
          expect(captureData.length).to.equal(1);
          expect(captureData[0]).to.equal('Hello World');
        });
      });
    });
  });
});
