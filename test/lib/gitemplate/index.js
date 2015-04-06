/*eslint func-names: 0, new-cap: 0, no-unused-expressions: 0, no-wrap-func: 0*/
'use strict';

const sinon = require('sinon');
const chai = require('chai');

chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

const gitemplate = require('../../..');
const Gitemplate = gitemplate.Gitemplate;

require('sinon-doublist')(sinon, 'mocha');

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
      this.clock = this.sandbox.useFakeTimers();

      this.gt = new Gitemplate();
      this.gt
        .set('name', this.name)
        .set('src', this.src)
        .set('dst', this.dst)
        .set('desc', this.desc)
        .set('json', this.json)
        .set('repo', this.repo)
        .init();

      require('sinon-doublist-fs')(this);
    });

    afterEach(function() {
      this.restoreFs();
    });

    it('should clone repo', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      this.gt.cloneRepo();
      stub.should.have.been.calledWith('exec', 'git clone /src /dst');
    });

    it('should remove .git/', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      this.gt.rmGitDir();
      stub.should.have.been.calledWithExactly('rm', '-rf', '/dst/.git');
    });

    it('should replace content built-in name var', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.returns(this.resOK);
      const res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        'exec',
        this.findCmdHead +
        'gitemplate_name/my-new-proj' +
        this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should replace content "desc" var', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.returns(this.resOK);
      const res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        'exec',
        this.findCmdHead +
        'gitemplate_desc/some browser\\/node proj' +
        this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should ignore content "repo" const if value missing', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.returns(this.resOK);
      this.gt.set('repo', null);
      const res = this.gt.replaceContentVars();
      stub.should.not.have.been.calledWith('exec', this.findRepoCmd);
      res.should.deep.equal(this.resOK);
    });

    it('should replace content "repo" const if value exists', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.withArgs('exec').returns(this.resOK);
      const res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith('exec', this.findRepoCmd);
      res.should.deep.equal(this.resOK);
    });

    it('should replace content "year" var', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.withArgs('exec').returns(this.resOK);
      const res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        'exec',
        this.findCmdHead + 'gitemplate_year/1970' + this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should replace custom content vars', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.withArgs('exec').returns(this.resOK);
      const res = this.gt.replaceContentVars();
      stub.should.have.been.calledWith(
        'exec',
        this.findCmdHead + 'gitemplate_m1/v1' + this.findCmdFoot
      );
      stub.should.have.been.calledWith(
        'exec',
        this.findCmdHead + 'gitemplate_m2/v2' + this.findCmdFoot
      );
      res.should.deep.equal(this.resOK);
    });

    it('should replace built-in name vars in files', function() {
      this.stubTree('/dst/gitemplate_name.js');
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWithExactly(
        'mv',
        '/dst/gitemplate_name.js', '/dst/my-new-proj.js'
      );
    });

    it('should replace built-in name vars in dirs', function() {
      this.stubTree('/dst/gitemplate_name/index.js');
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWithExactly(
        'mv', '/dst/gitemplate_name', '/dst/my-new-proj'
      );
    });

    it('should replace built-in name vars in dirs before files', function() {
      this.stubTree(['/dst/bin/gitemplate_name', '/dst/lib/gitemplate_name/index.js']);
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWith(
        'mv', '/dst/lib/gitemplate_name', '/dst/lib/my-new-proj'
      );
      spy.should.have.been.calledWith(
        'mv', '/dst/bin/gitemplate_name', '/dst/bin/my-new-proj'
      );
    });

    it('should replace custom name vars in files', function() {
      this.stubTree(['/dst/gitemplate_m1.js', '/dst/gitemplate_m2.js']);
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWithExactly('mv', '/dst/gitemplate_m1.js', '/dst/v1.js');
      spy.should.have.been.calledWithExactly('mv', '/dst/gitemplate_m2.js', '/dst/v2.js');
    });

    it('should replace custom name vars in dirs', function() {
      this.stubTree(['/dst/gitemplate_m1/index.js', '/dst/gitemplate_m2/index.js']);
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWithExactly('mv', '/dst/gitemplate_m1', '/dst/v1');
      spy.should.have.been.calledWithExactly('mv', '/dst/gitemplate_m2', '/dst/v2');
    });

    it('should replace custom name vars in dirs before files', function() {
      this.stubTree(['/dst/bin/gitemplate_m1', '/dst/lib/gitemplate_m2/index.js']);
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWith('mv', '/dst/lib/gitemplate_m2', '/dst/lib/v2');
      spy.should.have.been.calledWith('mv', '/dst/bin/gitemplate_m1', '/dst/bin/v1');
    });

    it('should replace case-insensitive custom name vars in files', function() {
      this.stubTree(['/dst/Gitemplate_m1.js', '/dst/Gitemplate_m2.js']);
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWithExactly('mv', '/dst/Gitemplate_m1.js', '/dst/v1.js');
      spy.should.have.been.calledWithExactly('mv', '/dst/Gitemplate_m2.js', '/dst/v2.js');
    });

    it('should replace case-insensitive custom name vars in dirs', function() {
      this.stubTree(['/dst/Gitemplate_m1/index.js', '/dst/Gitemplate_m2/index.js']);
      const spy = this.spy(this.gt.shelljs, '_');
      this.gt.replaceNameVars();
      spy.should.have.been.calledWithExactly('mv', '/dst/Gitemplate_m1', '/dst/v1');
      spy.should.have.been.calledWithExactly('mv', '/dst/Gitemplate_m2', '/dst/v2');
    });

    it('should init repo', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.withArgs('exec').returns(this.resOK);
      const res = this.gt.initRepo();
      stub.should.have.been.calledWithExactly('cd', this.dst);
      stub.should.have.been.calledWith('exec', 'git init');
      res.should.deep.equal(this.resOK);
    });

    it('should set repo GitHub remote origin', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.withArgs('exec').returns(this.resOK);
      const res = this.gt.setGithubOrigin();
      stub.should.have.been.calledWithExactly('cd', this.dst);
      stub.should.have.been.calledWith(
        'exec',
        'git remote add origin git@github.com:user/proj.git'
      );
      res.should.deep.equal(this.resOK);
    });

    it('should get repo sha', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.withArgs('exec').returns({output: '7858ada150cf927d6d8a6b3a7f8b63d9917d4185'});
      this.gt.getRepoOriginSha().should.equal('7858ada150');
    });

    it('should get remote origin url', function() {
      const stub = this.stub(this.gt.shelljs, '_');
      stub.withArgs('exec').returns({
        output:
          '* remote origin\n' +
          'Fetch URL: git@github.com:user/repo-fetch.git\n' +
          'Push  URL: git@github.com:user/repo-push.git\n'
      });
      this.gt.getRepoOriginUrl().should.equal('git@github.com:user/repo-fetch.git');
    });
  });
});
