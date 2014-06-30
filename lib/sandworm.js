var Job = require('./job');
exports.crawl = function(url) {
  var job = Job.create(url);
  process.nextTick(function() {
    job.start();
  });
  return job;
};
