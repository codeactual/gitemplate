var sinon = require('sinon');
var chai = require('chai');
var shelljs = require('shelljs');
var fs = require('fs');
var util = require('util');
var sprintf = util.format;

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var gitemplate = require('./dist/gitemplate');
var Gitemplate = gitemplate.Gitemplate;
var requireComponent = gitemplate.require;

requireComponent('sinon-doublist')(sinon, 'mocha');
requireComponent('sinon-doublist-fs')(fs, 'mocha');

describe('gitemplate', function() {
  before(function() {
    this.name = 'my-new-proj';
    this.src = '/src';
    this.dst = '/dst';
    this.desc = 'some browser/node proj';
    this.json = {m1: 'v1', m2: 'v2'};
    this.repo = 'user/proj';
    this.resOK = {code: 0};
    this.findCmdHead = "find /dst -type f -exec perl -p -i -e 's/";
    this.findCmdFoot = "/gi' {} \\;";
    this.findRepoCmd =
      this.findCmdHead +
      'gitemplate_repo/user\\/proj' +
      this.findCmdFoot;
  });

  describe('Gitemplate', function() {
    beforeEach(function() {
      this.gt = new Gitemplate();
      this.gt
        .set('name', this.name)
        .set('src', this.src)
        .set('dst', this.dst)
        .set('desc', this.desc)
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

    it('should replace content built-in name var', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        this.findCmdHead +
        'gitemplate_name/my-new-proj' +
        this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should replace content "desc" var', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        this.findCmdHead +
        'gitemplate_desc/some browser\\/node proj' +
        this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should ignore content "repo" var if value missing', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      this.gt.set('repo', null);
      var res = this.gt.replaceContentVars();
      stub.should.not.have.been.calledWith(this.findRepoCmd);
      res.should.deep.equal(this.resOK);
    });

    it('should replace content "repo" var if value exists', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(this.findRepoCmd);
      res.should.deep.equal(this.resOK);
    });

    it('should replace content "year" var', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        this.findCmdHead + 'gitemplate_year/1970' + this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should replace custom content vars', function() {
      var stub = this.stub(shelljs, 'exec');
      stub.returns(this.resOK);
      var res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        this.findCmdHead + 'gitemplate_m1/v1' + this.findCmdFoot
      );
      stub.should.have.been.calledWith(
        this.findCmdHead + 'gitemplate_m2/v2' + this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should replace built-in name vars in files', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/gitemplate_name.js')
      ]).make();
      var stub = this.stub(shelljs, 'mv');
      this.gt.replaceNameVars();
      stub.should.have.been.calledWithExactly(
        '/dst/gitemplate_name.js', '/dst/my-new-proj.js'
      );
    });

    it('should replace built-in name vars in dirs', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/gitemplate_name').readdir([
          this.stubFile('/dst/gitemplate_name/index.js')
        ])
      ]).make();
      var stub = this.stub(shelljs, 'mv');
      this.gt.replaceNameVars();
      stub.should.have.been.calledWithExactly(
        '/dst/gitemplate_name', '/dst/my-new-proj'
      );
    });

    it('should replace built-in name vars in dirs before files', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/bin/gitemplate_name'),
        this.stubFile('/dst/lib/gitemplate_name').readdir([
          this.stubFile('/dst/lib/gitemplate_name/index.js')
        ])
      ]).make();
      var spy = this.spy(shelljs, 'mv');
      this.gt.replaceNameVars();
      spy.args.length.should.equal(2);
      spy.args[0].should.deep.equal([
        '/dst/lib/gitemplate_name', '/dst/lib/my-new-proj'
      ]);
      spy.args[1].should.deep.equal([
        '/dst/bin/gitemplate_name', '/dst/bin/my-new-proj'
      ]);
    });

    it('should replace custom name vars in files', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/gitemplate_m1.js'),
        this.stubFile('/dst/gitemplate_m2.js')
      ]).make();
      var stub = this.stub(shelljs, 'mv');
      var res = this.gt.replaceNameVars();
      stub.should.have.been.calledWithExactly('/dst/gitemplate_m1.js', '/dst/v1.js');
      stub.should.have.been.calledWithExactly('/dst/gitemplate_m2.js', '/dst/v2.js');
    });

    it('should replace custom name vars in dirs', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/gitemplate_m1/index.js'),
        this.stubFile('/dst/gitemplate_m2/index.js')
      ]).make();
      var stub = this.stub(shelljs, 'mv');
      var res = this.gt.replaceNameVars();
      stub.should.have.been.calledWithExactly('/dst/gitemplate_m1/index.js', '/dst/v1/index.js');
      stub.should.have.been.calledWithExactly('/dst/gitemplate_m2/index.js', '/dst/v2/index.js');
    });

    it('should replace custom name vars in dirs before files', function() {
      this.stubFile('/dst').readdir([
        this.stubFile('/dst/bin/gitemplate_m1'),
        this.stubFile('/dst/lib/gitemplate_m2').readdir([
          this.stubFile('/dst/lib/gitemplate_m2/index.js')
        ])
      ]).make();
      var stub = this.stub(shelljs, 'mv');
      var res = this.gt.replaceNameVars();
      stub.args[2].should.deep.equal(['/dst/lib/gitemplate_m2', '/dst/lib/v2']);
      stub.args[3].should.deep.equal(['/dst/bin/gitemplate_m1', '/dst/bin/v1']);
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
      stub.exec.should.have.been.calledWith(
        'git remote add origin git@github.com:user/proj.git'
      );
      res.should.deep.equal(this.resOK);
    });

    it('should get repo sha', function() {
      var stub = this.stubMany(shelljs, ['cd', 'exec']);
      stub.exec.returns({output: '7858ada150cf927d6d8a6b3a7f8b63d9917d4185'});
      this.gt.getRepoOriginSha().should.equal('7858ada150');
    });

    it('should get remote origin url', function() {
      var stub = this.stubMany(shelljs, ['cd', 'exec']);
      stub.exec.returns({
        output:
          '* remote origin\n' +
          'Fetch URL: git@github.com:user/repo-fetch.git\n' +
          'Push  URL: git@github.com:user/repo-push.git\n'
      });
      this.gt.getRepoOriginUrl().should.equal('git@github.com:user/repo-fetch.git');
    });
  });
});
