var fs = require('fs');

var content = {};

content['www.foobar.com'] = fs.readFileSync('./www.foobar.com.txt');

module.exports = content;
