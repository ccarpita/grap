module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ";"
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    jshint: {
      files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          module: true,
          exports: true
        }
      }
    },
    mocha: {
      src: ['test/**/*.js'],
      reporter: 'spec',
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'mocha']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  //grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('mocha', 'Run mocha tests', function() {
    var done = this.async();
    var exec = require('child_process').exec;
    exec('mocha -R spec test/unit', function(err, stdout, stderr) {
      grunt.log.writeln(stdout);
      if (stderr) {
        grunt.log.error(stderr);
      }
      done(err !== null ? false : true);
    });
  });

  grunt.registerTask('default', ['jshint', 'mocha', 'concat', 'uglify']);
  grunt.registerTask('test', ['jshint', 'mocha']);
};
