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
    this.name = 'myproj';
    this.src = '/src';
    this.dst = '/dst';
    this.json = {m1: 'v1', m2: 'v2'};
    this.repo = 'user/proj';
    this.resOK = {code: 0};
    this.findCmdHead = "find /dst -type f -exec perl -p -i -e 's/";
    this.findCmdFoot = "/g' {} \\;";
    this.findRepoCmd = this.findCmdHead + '\\{\\{gitemplate\\.repo\\}\\}/user\\/proj' + this.findCmdFoot;
  });

  describe('Gitemplate', function() {
    beforeEach(function() {
      this.gt = new Gitemplate();
      this.gt
        .set('name', this.name)
        .set('src', this.src)
        .set('dst', this.dst)
        .set('json', this.json)
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
      stub.returns(this.resOK);
      var res = this.gt.expandContentMacros();
      stub.should.have.been.calledWith(
        this.findCmdHead + '\\{\\{gitemplate\\.name\\}\\}/myproj' + this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should ignore content "repo" macro if value missing', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      this.gt.set('repo', null);
      var res = this.gt.expandContentMacros();
      stub.should.not.have.been.calledWith(this.findRepoCmd);
      res.should.deep.equal(this.resOK);
    });

    it('should expand content "repo" macro if value exists', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.expandContentMacros();
      stub.should.have.been.calledWith(this.findRepoCmd);
      res.should.deep.equal(this.resOK);
    });

    it('should expand content "year" macro', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.expandContentMacros();
      stub.should.have.been.calledWith(
        this.findCmdHead + '\\{\\{gitemplate\\.year\\}\\}/1969' + this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should expand content custom macros', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.expandContentMacros();
      stub.should.have.been.calledWith(
        this.findCmdHead + '\\{\\{gitemplate\\.m1\\}\\}/v1' + this.findCmdFoot
      );
      stub.should.have.been.calledWith(
        this.findCmdHead + '\\{\\{gitemplate\\.m2\\}\\}/v2' + this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should expand file "name" macro', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/gitemplate.name')
      ]).make();
      var stub = this.stub(shelljs, 'mv');
      this.gt.expandNameMacros();
      stub.should.have.been.calledWithExactly('/dst/gitemplate.name', '/dst/myproj');
    });

    it('should init repo', function() {
      var stub = this.stubMany(shelljs, ['cd', 'exec']);
      stub.exec.returns(this.resOK);
      var res = this.gt.initRepo();
      stub.cd.should.have.been.calledWithExactly(this.dst);
      stub.exec.should.have.been.calledWith('git init');
      res.should.deep.equal(this.resOK);
    });

    it('should set repo GitHub remote origin', function() {
      var stub = this.stubMany(shelljs, ['cd', 'exec']);
      stub.exec.returns(this.resOK);
      var res = this.gt.setGithubOrigin();
      stub.cd.should.have.been.calledWithExactly(this.dst);
      stub.exec.should.have.been.calledWith('git remote add origin git@github.com:user/proj.git');
      res.should.deep.equal(this.resOK);
    });
  });
});
