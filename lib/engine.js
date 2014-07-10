var util = require('util');
var when = require('when');
var jsdom = require('jsdom');
var request = require('request');

function Engine() {}

function JsDom() {}
util.inherits(JsDom, Engine);

JsDom.prototype.get = function(url) {
  return when.promise(function(resolve, reject) {
    request(url, function(error, response, body) {
      if (error) {
        reject(error);
      } else if (response.statusCode !== 200) {
        reject('HTTP Error: ' + response.statusCode);
      } else {
        jsdom.env(body, [], function(errors, window) {
          resolve(window);
        });
      }
    });
  });
};

function Phantom() {}
util.inherits(Phantom, Engine);

Engine.JsDom = JsDom;
module.exports = Engine;
