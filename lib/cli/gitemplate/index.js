module.exports = function() {
  'use strict';

  var gt = require('../../gitemplate').create();
  gt
    .set('name', this.options.name)
    .set('src', this.options.src)
    .set('dst', this.options.dst)
    .set('desc', this.options.desc)
    .set('json', JSON.parse(this.options.json))
    .set('repo', this.options.repo)
    .set('verbose', this.options.verbose)
    .init();

  this.exitOnMissingOption(['name', 'src', 'dst']);

  this.exitOnShelljsErr(gt.cloneRepo());

  gt.set('originSha', gt.getRepoOriginSha());
  gt.set('originUrl', gt.getRepoOriginUrl());

  gt.rmGitDir();
  this.exitOnShelljsErr(gt.replaceContentVars());
  gt.replaceNameVars();

  if (this.options.repo) {
    this.exitOnShelljsErr(gt.initRepo());
    this.exitOnShelljsErr(gt.setGithubOrigin());
  }

  this.exitOnShelljsErr(gt.runPostReplace());
};
