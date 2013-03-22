module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    jshint: {
      src: {
        files: {
          src: ['index.js']
        }
      },
      grunt: {
        files: {
          src: ['Gruntfile.js']
        }
      },
      tests: {
        files: {
          src: ['test.js']
        }
      },
      json: {
        files: {
          src: ['*.json']
        }
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
};
