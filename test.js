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
var requireComponent = gitemplate.require;

requireComponent('sinon-doublist')(sinon, 'mocha');
requireComponent('sinon-doublist-fs')(fs, 'mocha');

describe('gitemplate', function() {
  before(function() {
    this.name = 'mycomponent';
    this.src = '/path/to/src';
    this.dst = '/path/to/dst';
  });

  describe('Gitemplate', function() {
    beforeEach(function() {
      this.gt = new Gitemplate();
      this.gt
        .set('name', this.name)
        .set('src', this.src)
        .set('dst', this.dst)
        .set('nativeRequire', require).init();
    });

    it('should clone repo', function() {
      var stub = this.stub(shelljs, 'exec');
      this.gt.cloneRepo();
      stub.should.have.been.calledWith('git clone /path/to/src /path/to/dst');
    });

    it('should remove .git/', function() {
      var stub = this.stub(shelljs, 'rm');
      this.gt.rmGitDir();
      stub.should.have.been.calledWithExactly('-r', '/path/to/dst/.git');
    });

    it('should expand name macros', function() {
      var stub = this.stub(shelljs, 'exec');
      this.gt.expandMacros();
      stub.should.have.been.calledWith(
        'perl -p -i -e "s/{{gitemplate.name}}/mycomponent/g" /path/to/dst/**/*'
      );
    });
  });
});
