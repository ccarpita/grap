var when = require('when');
var expect = require('chai').expect;
var nock = require('nock');
var crawl = require('../../lib/sandworm').crawl;

describe('Sandworm Library', function() {

  var mockUrl = 'http://www.foobar.com';

  describe('Crawling', function() {

    // Jsdom eval can be expensive
    this.timeout(10000);
    this.slow(2000);
    var defaultBaseUrl = 'http://localhost';
    var defaultPace = 0.001;
    var defaultPaceRand = 0.0001;

    var contentMap= {};
    contentMap['/'] = '<ul id="content" class="links"><li><span class="answer"><a href="http://localhost/foo">Link to Answer</a></span></li></ul>';
    contentMap['/foo'] = '<div id="content"><span class="answer">Hello World</span></div>';

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

      return crawlTest(contentMap, function() {
        this.follow(/\/foo/)
          .each('#content span.answer')
            .extract('$text');
      }, function(data) {
        // check length == 1 to assert that `each` only applies to `follow` context
        expect(data.length).to.equal(1);
        expect(data[0][0]).to.equal('Hello World');
      });
    });

    it('Should execute selector handlers with the current element', function() {
      return crawlTest('<div id="content"><ul class="list"><li>One</li><li>Two</li></ul></div>', function() {
        this.each('#content ul li')(function(el) {
          expect(el.tagName).to.equal('LI');
          this.push(el.textContent);
        });
      }, function(data) {
        expect(data.length).to.equal(2);
        expect(data[0][0]).to.equal('One');
        expect(data[1][0]).to.equal('Two');
      });
    });

    it('Should execute follow handler with the current window', function() {
      return crawlTest(contentMap, function() {
        this.follow(/\/foo/)(function(window) {
          var span = window.document.querySelector('span.answer');
          this.push(span.textContent);
        });
      }, function(data) {
        expect(data.length).to.equal(1);
        expect(data[0][0]).to.equal('Hello World');
      });
    });

    it('Selector should emit notFound:elements', function() {
      return crawlTest('<div id="content"></div>', function() {
        var job = this;
        this.each('#content span.title').on('notFound:elements', function() {
          job.push('notFound:elements');
        });
      }, function(data) {
        expect(data[0][0]).to.equal('notFound:elements');
      });
    });

    it('Should execute the job handler on init', function() {
      return crawlTest('<div></div>', function() {
        this(function() { this.job.push('ok'); });
      }, function(data) {
        expect(data.length).to.equal(1);
        expect(data[0][0]).to.equal('ok');
      });
    });

    it('Should return valid crawl stats', function() {
      return crawlTest('<div>foo</div>', function() {
        this.extract('div $text');
      }, function(data, job) {
        expect(job.getNumCrawled()).to.equal(1);
        expect(job.wasCrawled(defaultBaseUrl)).to.equal(true);
      });
    });

    function extractTest(html, extract, assertValue) {
      return crawlTest(html, function() { this.extract(extract); }, assertValue);
    }

    function crawlTest(html, businessLogic, assertion) {
      return when.promise(function(resolve, reject) {
        var httpScope = nock(defaultBaseUrl);
        if (typeof html === 'string') {
          httpScope.get('/').reply(200, html);
        } else if (typeof html === 'object') {
          for (var path in html) {
            if (html.hasOwnProperty(path)) {
              httpScope.get(path).reply(200, html[path]);
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

        var job = crawl(defaultBaseUrl).browser('jsdom');
        job.pace(defaultPace, defaultPaceRand);
        businessLogic.apply(job);
        job.pipe(function(data) {
          captureData.push(data);
        })
        .on('error', function(error) {
          console.error('[Crawl Error]', error);
        })
        .on('complete', function() {
          try {
            assertion(captureData, job);
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });
    }

  });
});
