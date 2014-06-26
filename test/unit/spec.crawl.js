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
  };

  describe('Crawling', function() {

    it('Should handle a trivial single-page crawl with a push declaration', function() {
      return when.promise(function(resolve, reject) {
        var url = 'http://localhost:8080';
        mockEngine.setUrlContent(url, '<a class="title">Hello World</a>');

        crawl(url)
          .push('a.title $text')
        .job
        .on('data', function(data) {
          console.log(data);
          try {
            expect(data[0].to.be('Hello World'));
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });
    });
  });
});
