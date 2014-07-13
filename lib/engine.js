var util = require('util');
var when = require('when');
var jsdom = require('jsdom');
var request = require('request');

function Engine() {
  throw new Error('Cannot instantiate Engine base class');
}
Engine.prototype.get = function() {
  throw new Error('Not implemented');
};

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
          if (typeof window === 'object' && window.document) {
            resolve(window);
          } else {
            reject('DOM Not Created');
          }
        });
      }
    });
  });
};

function Phantom() {}
util.inherits(Phantom, Engine);
Engine.Phantom = Phantom;

Engine.JsDom = JsDom;
module.exports = Engine;
