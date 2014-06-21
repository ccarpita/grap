
var sw = require('sandworm');
var expect = require('expect.js');
var mockContent = require('../mock/content');

describe('Sandworm Library', function() {

  var mockUrl = 'http://www.foobar.com';

  before(function() {
    sw.disableHttp();
    for (var url in mockContent) {
      sw.setUrlContent(url, mockContent[url]);
    }
  });

  describe('Crawling', function() {

    it('Should have a pace method', function() {
      var job = sw.crawl(mockUrl);
      expect(job.pace).to.be.a(Function);
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
