'use strict';

exports.init = function init(provider) {
  provider
    .option('-n, --name <project name>', 'my-new-proj', String)
    .option('-s, --src <source repo>', 'git@github.com:me/one-of-my-templates.git', String)
    .option('-d, --dst <destination dir>', '~/dev/my-new-proj', String)
    .option('-D, --desc <project description>', 'gets it done', String, '')
    .option('-r, --repo <user/project>', 'set gitemplate.repo and auto init/remote', String, '')
    .option('-j, --json <custom template variables>', '\'{"k1":"v1","k2":"v2",...}\'', String, '{}')
    .option('-v, --verbose');
};

exports.run = function run() {
  const path = require('path');

  const gt = require('../../gitemplate').create();
  gt
    .set('name', this.options.name)
    .set('src', this.options.src)
    .set('dst', path.resolve(this.options.dst))
    .set('desc', this.options.desc)
    .set('json', JSON.parse(this.options.json))
    .set('repo', this.options.repo)
    .set('verbose', this.options.verbose)
    .init();

  const exitOnShelljsErr = (function exitOnShelljsErr(res) {
    if (res.code !== 0) { this.exit(res.output, res.code); }
  }).bind(this);

  this.exitOnMissingOption(['name', 'src', 'dst']);

  exitOnShelljsErr(gt.cloneRepo());

  gt.set('originSha', gt.getRepoOriginSha());
  gt.set('originUrl', gt.getRepoOriginUrl());

  gt.rmGitDir();
  exitOnShelljsErr(gt.replaceContentVars());
  gt.replaceNameVars();

  if (this.options.repo) {
    exitOnShelljsErr(gt.initRepo());
    exitOnShelljsErr(gt.setGithubOrigin());
  }

  const postReplaceResult = gt.runPostReplace();
  if (postReplaceResult) {
    exitOnShelljsErr(postReplaceResult);
  }
};
