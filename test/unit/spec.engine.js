var expect = require('chai').expect;
var Engine = require('../../lib/engine');
var nock = require('nock');
var when = require('when');

describe('Engine', function() {

  var defaultUrl = 'http://localhost:8079';

  it('Should throw an error if the base class is instantiated', function() {
    var thrown = false;
    try {
      var engine = new Engine();
    } catch(e) {
      thrown = true;
    }
    if (!thrown) {
      throw new Error('Error not thrown');
    }
  });

  describe('Phantom', function() {
    it('Should throw a non-implementation error', function() {
      var phantom = new Engine.Phantom();
      var thrown = false;
      try {
        phantom.get(defaultUrl);
      } catch(e) {
        expect(e.message).to.equal('Not implemented');
        thrown = true;
      }
      if (!thrown) {
        throw new Error('Error not thrown');
      }
    });
  });

  describe('JsDom', function() {
    it('Should resolve to valid DOM window', function() {
      nock(defaultUrl).get('/').reply(200, '<div id="test">Hello World</div>');
      var jsdom = new Engine.JsDom();
      return jsdom.get(defaultUrl)
        .then(function(window) {
          expect(typeof window).to.equal('object');
          expect(typeof window.document).to.equal('object');
          var div = window.document.querySelector('#test');
          expect(div.tagName).to.equal('DIV');
          expect(div.innerHTML).to.equal('Hello World');
        });
    });

    it('Should reject with an error if status code is not 200', function() {
      nock(defaultUrl).get('/').reply(404, 'Not Found');
      var jsdom = new Engine.JsDom();
      return when.promise(function(resolve, reject) {
        jsdom.get(defaultUrl)
          .then(function(window) {
            reject('Should not build DOM');
          })
          .catch(function(error) {
            resolve();
          });
      });
    });

    it('Should reject with an error if content times out', function() {
      var jsdom = new Engine.JsDom();
      return when.promise(function(resolve, reject) {
        jsdom.get('http://doesnotexist.orsoihopemaybe.ishoulddesignthis.testbetter:8328')
        .then(function(window) {
          reject('DOM should not exist');
        })
        .catch(function(error) {
          resolve(error);
        });
      });
    });

    it('Should reject with an error if content is not HTML', function() {
      nock(defaultUrl).get('/').reply(200, new Buffer(32));
      var jsdom = new Engine.JsDom();
      return when.promise(function(resolve, reject) {
        jsdom.get(defaultUrl)
          .then(function(window) {
            reject('Should not build DOM');
          })
          .catch(function(error) {
            resolve();
          });
      });
    });

  });

});
