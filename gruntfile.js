module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  var exec = require('child_process').exec;
  var mochaArgs = ' ' + (process.env.MOCHA_ARGS || '');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
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
      unitTest: './node_modules/.bin/mocha -R spec' + mochaArgs,
      coverage: './node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- -u exports test/unit -R spec' + mochaArgs,
      debug: 'npm-debug _mocha -s 600000 -s 600000' + mochaArgs
    }
  });

  grunt.registerTask('default', ['jshint', 'exec:unitTest']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('test', ['lint', 'exec:coverage']);

  grunt.registerTask('debug', ['exec:debug']);
};
