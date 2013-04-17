module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  var mochaShelljsOpt = {stdout: true, stderr: true};

  grunt.initConfig({
    jshint: {
      src: {
        files: {
          src: ['index.js', 'lib/**/*.js']
        }
      },
      grunt: {
        files: {
          src: ['Gruntfile.js']
        }
      },
      tests: {
        options: {
          expr: true
        },
        files: {
          src: ['test/lib/**/*.js']
        }
      },
      json: {
        files: {
          src: ['*.json']
        }
      }
    },
    uglify: {
      dist: {
        options: {
          compress: false,
          mangle: false,
          beautify: true
        },
        files: {
          'dist/gitemplate.js': 'dist/gitemplate.js'
        }
      }
    },
    shell: {
      options: {
        failOnError: true
      },
      build: {
        command: 'component install --dev && component build --standalone gitemplate --name gitemplate --out dist --dev'
      },
      dist: {
        command: 'component build --standalone gitemplate --name gitemplate --out dist'
      },
      shrinkwrap: {
        command: 'npm shrinkwrap'
      },
      test_lib: {
        options: mochaShelljsOpt,
        command: "mocha --colors --reporter spec --recursive test/lib"
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['shell:build']);
  grunt.registerTask('dist', ['default', 'shell:dist', 'uglify:dist', 'shell:shrinkwrap']);
  grunt.registerTask('test', ['build', 'shell:test_lib']);
};
