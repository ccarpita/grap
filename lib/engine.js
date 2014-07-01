var util = require('util');
var when = require('when');
var jsdom = require('jsdom');
var http = require('http');

function Engine() {}

function Mock() {
  this.mocks = {};
}
util.inherits(Mock, Engine);

Mock.prototype.get = function(url) {
  var mock = this;
  console.log(mock, mock.mocks, url);
  return when.promise(function(resolve, reject) {
    if (mock.mocks[url]) {
      jsdom.env(mock.mocks[url], [], function(errors, window) {
        resolve(window);
      });
    } else {
      // TODO: http error
      reject("Mock Not Found");
    }
  });
};

Mock.prototype.setUrlContent = function(url, content) {
  this.mocks[url] = content;
};

function JsDom() {}
util.inherits(JsDom, Engine);

JsDom.prototype.get = function(url) {
  return when.promise(function(resolve, reject) {
    // TODO: wrong API
    http.get(url, function(error, content) {
      if (error) {
        reject(error);
      } else {
        jsdom.env(content, [], function(errors, window) {
          resolve(window);
        });
      }
    });

  });
};

function Phantom() {}
util.inherits(Phantom, Engine);

Engine.JsDom = JsDom;
Engine.Mock = Mock;
module.exports = Engine;
