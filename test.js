var sinon = require('sinon');
var chai = require('chai');

var should = chai.should();
chai.Assertion.includeStack = true;

var fs = require('fs');
var gitemplate = require('./build/build');
var Gitemplate = gitemplate.Gitemplate;

gitemplate.require('sinon-doublist')(sinon, 'mocha');
gitemplate.require('sinon-doublist-fs')(fs, 'mocha');

describe('gitemplate', function() {
  describe('Gitemplate', function() {
    it('should clone a git repo', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should gracefully exit on failed clone', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });
  });

  describe('Post-clone processing', function() {
    before(function(hookDone) {
      // TODO delete old clone if present
      // TODO one clone operation shared by all assertions below
      hookDone();
    });

    it('should name directory', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should delete .git/', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should expand name macros', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });
  });

  describe('CLI', function() {
    it('should not init git repo by default', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should display full destination path', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });
  });
});
