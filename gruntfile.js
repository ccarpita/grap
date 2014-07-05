module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  var exec = require('child_process').exec;
  var mochaArgs = ' ' + (process.env.MOCHA_ARGS || '');

  var execTest = './node_modules/.bin/mocha -R spec test/unit' + mochaArgs;
  var execCoverage = './node_modules/.bin/istanbul cover ' +
      './node_modules/.bin/_mocha -- ' +
      '-u exports test/unit -R spec' + mochaArgs;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          module: true,
          exports: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'exec:unitTest']
    },
    exec: {
      unitTest: execTest,
      coverage: execCoverage,
      coverageBuild: execCoverage + ' && cat ./coverage/lcov.info | ' +
          './node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage',
      debug: 'npm-debug _mocha -s 600000 -s 600000' + mochaArgs
    }
  });

  grunt.registerTask('default', ['jshint', 'exec:unitTest']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('coverage', ['exec:coverage']);
  grunt.registerTask('test', ['lint', 'exec:coverageBuild']);

  grunt.registerTask('debug', ['exec:debug']);
};
