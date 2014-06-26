var Job = require('./job');
exports.crawl = function(url) {
  var job = new Job(url);
  setTimeout(function() {
    job.start();
  }, 0);
  return job;
};
