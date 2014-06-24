var Job = require('./job');

exports.crawl = function(url) {
  return new Job(url);
};
