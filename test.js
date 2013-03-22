var sinon = require('sinon');
var chai = require('chai');
var shelljs = require('shelljs');
var fs = require('fs');
var util = require('util');
var sprintf = util.format;

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var gitemplate = require('./build/build');
var Gitemplate = gitemplate.Gitemplate;

gitemplate.require('sinon-doublist')(sinon, 'mocha');
gitemplate.require('sinon-doublist-fs')(fs, 'mocha');

describe('gitemplate', function() {
  before(function() {
    this.name = 'mycomponent';
    this.src = __dirname + '/.git';
    this.dst = __dirname + '/tmp/clone';
  });

  describe('Post-clone processing', function() {
    before(function() {
      shelljs.rm('-rf', this.dst);
      this.gt = new Gitemplate();
      this.gt.set('name', this.name).set('nativeRequire', require).init();
      this.res = this.gt.cloneRepo(this.src, this.dst);
    });

    it('should begin with successful clone', function() {
      this.res.code.should.equal(0);
    });

    it('should name directory', function() {
      console.log('\x1B[33mINCOMPLETE'); // TODO
    });

    it('should delete .git/', function() {
      console.log('\x1B[33mINCOMPLETE'); // TODO
    });

    it('should expand name macros', function() {
      console.log('\x1B[33mINCOMPLETE'); // TODO
    });
  });

  describe('CLI', function() {
    it('should not init git repo by default', function() {
      console.log('\x1B[33mINCOMPLETE'); // TODO
    });

    it('should display full destination path', function() {
      console.log('\x1B[33mINCOMPLETE'); // TODO
    });
  });
});
