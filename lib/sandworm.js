var Job = require('./job');

exports.crawl = function(startUrl, opt) {
  return new Job(startUrl, opt);
};
