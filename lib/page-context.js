var linkutils = require('linkutils');

function FollowContext(pattern) {

};

function PageContext(url, document) {
  if (!url || typeof url !== 'string') {
    throw new Error("Context requires url as first argument");
  }
  if (!document || typeof document !== 'object') {
    throw new Error("Context requires document as first argument");
  }

  var _links;
  this.getLinks = function() {
    if (!_links) {
      _links = [];
      var anchors = document.getElementsByTagName('a');
      for (var i = 0; i < anchors.length; i++) {
        if (anchors[i].href && anchors[i].href.match(/^https?:/)) {
          links.push(anchors[i].href);
        }
      }
    }
    return _links;
  };

  var _follows = [];
  this.getFollowPatterns = function() { return _follows; };

  this.follow = function(pattern) {
    return new FollowContext(pattern);
  };

};

module.exports = PageContext;
