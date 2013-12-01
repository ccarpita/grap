
var Job = require('../../src/grap').Job;
var expect = require('expect.js');

describe('Grap Library', function() {
  it('Job should be a constructor', function() {
    expect(Job).to.be.a(Function);
    var job = new Job();
    expect(job).to.be.a(Job);
  });
});
