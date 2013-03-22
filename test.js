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
    it('should read from user config from default file', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add license from local file', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add license from Github', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add TravisCI config', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add test.js', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add index.js', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add test.js', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add component.json', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add package.json', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add Gruntfile.json', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add .gitignore', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should add README', function(testDone) {
      console.log('\x1B[33mINCOMPLETE'); testDone(); // TODO
    });

    it('should init git repo', function(testDone) {
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
