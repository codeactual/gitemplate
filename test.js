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
    this.src = '/src';
    this.dst = '/dst';
    this.repo = 'user/proj';
  });

  describe('Gitemplate', function() {
    beforeEach(function() {
      this.gt = new Gitemplate();
      this.gt
        .set('name', this.name)
        .set('src', this.src)
        .set('dst', this.dst)
        .set('repo', this.repo)
        .set('nativeRequire', require).init();
    });

    it('should clone repo', function() {
      var stub = this.stub(shelljs, 'exec');
      this.gt.cloneRepo();
      stub.should.have.been.calledWith('git clone /src /dst');
    });

    it('should remove .git/', function() {
      var stub = this.stub(shelljs, 'rm');
      this.gt.rmGitDir();
      stub.should.have.been.calledWithExactly('-rf', '/dst/.git');
    });

    it('should expand content "name" macro', function() {
      var stub = this.stub(shelljs, 'exec');
      this.gt.expandContentMacros();
      stub.should.have.been.calledWith(
        "find /dst -type f " +
        "-exec perl -p -i -e " +
        "'s/\\{\\{gitemplate\.name\\}\\}/mycomponent/g' {} \\;"
      );
    });

    it('should expand file "name" macro', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/gitemplate.name')
      ]).make();
      var stub = this.stub(shelljs, 'mv');
      this.gt.expandNameMacros();
      stub.should.have.been.calledWithExactly('/dst/gitemplate.name', '/dst/mycomponent');
    });

    it('should init repo', function() {
      var stub = this.stub(shelljs, 'exec');
      this.gt.initRepo();
      stub.should.have.been.calledWith('git init');
    });

    it('should set repo GitHub remote origin', function() {
      var stub = this.stubMany(shelljs, ['cd', 'exec']);
      this.gt.setGithubOrigin();
      stub.cd.should.have.been.calledWithExactly(this.dst);
      stub.exec.should.have.been.calledWith('git remote add origin git@github.com:user/proj.git');
    });
  });
});
