/**
 * Git cloning with template variables.
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

/**
 * Gitemplate constructor.
 */
exports.Gitemplate = Gitemplate;

/**
 * Create a new Gitemplate.
 *
 * @return {object}
 */
exports.create = function create() { return new Gitemplate(); };

/**
 * Extend Gitemplate.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function extendProto(ext) { return extend(Gitemplate.prototype, ext); };

const util = require('util');
const sprintf = util.format;
const outerShelljs = require('outer-shelljs');
const longCon = require('long-con');

const configurable = require('configurable');
const extend = require('extend');
const escapeRe = require('escape-regexp');
const defShellOpt = {silent: true};

/**
 * Gitemplate constructor.
 *
 * Usage:
 *
 *     const gt = require('gitemplate').create();
 *     gt
 *       .set('name', this.name)
 *       .set('src', this.src)
 *       .set('dst', this.dst)
 *       .set('desc', this.desc)
 *       .set('json', this.json)
 *       .set('repo', this.repo);
 *     gt.cloneRepo();
 *
 * Configuration:
 *
 * - `{string} desc` `gitemplate_desc` replacement value
 * - `{string} dst` Clone path
 * - `{object} json` Replacement key/value pairs from `--json`
 * - `{string} name` `gitemplate_name` replacement value
 * - `{string} originSha` `gitemplate_originSha` replacement value
 * - `{string} originUrl` `gitemplate_originUrl` replacement value
 * - `{string} src` Source repository URL/path
 * - `{string} year` `gitemplate_year` replacement value
 *
 * Properties:
 *
 * - `{object} shelljs` `OuterShelljs` instance
 * - `{object} stdout`
 *
 * @see OuterShelljs https://github.com/codeactual/outer-shelljs/blob/master/docs/OuterShelljs.md
 */
function Gitemplate() {
  this.settings = {
    name: '',
    desc: '',
    json: {},
    repo: '',
    year: (new Date()).getUTCFullYear(),
    originSha: '',
    originUrl: ''
  };

  this.shelljs = outerShelljs.create();

  const lc = longCon.create().set('time', false);
  this.stdout = lc.create('gitemplate', console.log); // eslint-disable-line no-console
}

configurable(Gitemplate.prototype);

/**
 * Apply collected configuration.
 */
Gitemplate.prototype.init = function init() {
  if (this.get('verbose')) {
    defShellOpt.silent = false;
  }

  if (!defShellOpt.silent) {
    this.shelljs.on('cmd', this.onShellCmd.bind(this));
  }
};

/**
 * Display details about each command in `--verbose` mode.
 *
 * Handler for the `cmd` event emitted from `OuterShelljs`.
 *
 * @api private
 */
Gitemplate.prototype.onShellCmd = function onShellCmd(method, args) {
  this.stdout('%s(%s)', method, JSON.stringify(args));
};

/**
 * Clone the configured repo.
 *
 * @return {object} `shelljs.exec()` result
 */
Gitemplate.prototype.cloneRepo = function cloneRepo() {
  const dst = this.get('dst');
  if (this.shelljs._('test', '-e', dst)) {
    return {code: 1, output: 'Destination already exists'};
  }
  return this.shelljs._(
    'exec',
    sprintf('git clone %s %s', this.get('src'), dst),
    defShellOpt
  );
};

/**
 * Remove `.git/` to prepare for a fresh init and remote origin.
 */
Gitemplate.prototype.rmGitDir = function rmGitDir() {
  this.shelljs._('rm', '-rf', this.get('dst') + '/.git');
};

/**
 * Replace macros found in repo file content.
 */
Gitemplate.prototype.replaceContentVars = function replaceContentVars() {
  const cmdHead = "find %s -type f -exec perl -p -i -e 's/";
  const cmdFoot = "/%s/gi' {} \\;";
  const dst = this.get('dst');
  const passThruKeys = ['name', 'desc', 'repo', 'year', 'originSha', 'originUrl'];
  let res = {code: 0};
  const self = this;

  passThruKeys.forEach(function forEachKey(key) {
    if (res.code !== 0) { // Prior exec() failed, bail out.
      return;
    }
    res = self.shelljs._(
      'exec',
      sprintf(cmdHead + gitemplateEscVar(key) + cmdFoot, dst, escapeRe(self.get(key))),
      defShellOpt
    );
  });
  if (res.code !== 0) { return res; }

  const json = this.get('json');
  Object.keys(json).forEach(function forEachKey(key) {
    res = self.shelljs._(
      'exec',
      sprintf(cmdHead + gitemplateEscVar(key) + cmdFoot, dst, escapeRe(json[key])),
      defShellOpt
    );
    if (res.code !== 0) { return res; }
  });

  return res;
};

/**
 * Replace macros found in repo file names.
 */
Gitemplate.prototype.replaceNameVars = function replaceNameVars() {
  const self = this;
  const name = this.get('name');
  const dst = this.get('dst');

  const nameVar = gitemplateVar('name');
  function mvNameVar(target) {
    self.shelljs._('mv', target, target.replace(nameVar, name));
  }

  let targets = this.shelljs._('find', dst).filter(function filterDir(file) { // In dir names
    return self.shelljs._('test', '-d', file) && file.match(nameVar);
  });
  targets.forEach(mvNameVar);
  targets = this.shelljs._('find', dst).filter(function filterFile(file) { // In file names
    return self.shelljs._('test', '-f', file) && file.match(nameVar);
  });
  targets.forEach(mvNameVar);

  const json = this.get('json');
  const jsonKeys = Object.keys(json);
  jsonKeys.forEach(function forEachKey(key) {
    const escapedKey = gitemplateEscVarCaseInsRe(key);
    function mvJsonVar(target) {
      self.shelljs._('mv', target, target.replace(escapedKey, json[key]));
    }

    const targets = self.shelljs._('find', dst).filter(function filterDir(file) {
      return self.shelljs._('test', '-d', file) && file.match(escapedKey);
    });
    targets.forEach(mvJsonVar);
  });

  jsonKeys.forEach(function forEachKey(key) {
    const escapedKey = gitemplateEscVarCaseInsRe(key);
    function mvJsonVar(target) {
      self.shelljs._('mv', target, target.replace(escapedKey, json[key]));
    }

    const targets = self.shelljs._('find', dst).filter(function filterFile(file) {
      return self.shelljs._('test', '-f', file) && file.match(escapedKey);
    });
    targets.forEach(mvJsonVar);
  });
};

/**
 * Initialize a repo in the clone dir.
 *
 * @return {object} `shelljs.exec()` result
 */
Gitemplate.prototype.initRepo = function initRepo() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._('exec', 'git init', defShellOpt);
};

/**
 * Set GitHub remote origin.
 */
Gitemplate.prototype.setGithubOrigin = function setGithubOrigin() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._(
    'exec',
    sprintf('git remote add origin git@github.com:%s.git', this.get('repo')),
    defShellOpt
  );
};

/**
 * Get replacement value for `gitemplate_originSha`.
 *
 * @return {string}
 * @api private
 */
Gitemplate.prototype.getRepoOriginSha = function getRepoOriginSha() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._('exec', 'git rev-parse HEAD', defShellOpt).output.slice(0, 10);
};

/**
 * Get replacement value for `gitemplate_originUrl`.
 *
 * @return {string}
 * @api private
 */
Gitemplate.prototype.getRepoOriginUrl = function getRepoOriginUrl() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._('exec', 'git remote show origin', defShellOpt).output.match(/Fetch\s+URL: (\S+)/)[1];
};

/**
 * Run the `.gitemplate.postreplace` script if present.
 *
 * @return {object} `shelljs.exec()` result
 */
Gitemplate.prototype.runPostReplace = function runPostReplace() {
  const dst = this.get('dst');
  const script = dst + '/.gitemplate.postreplace';
  if (!this.shelljs._('test', '-e', script)) {
    return {code: 0, res: ''};
  }
  this.shelljs._('cd', dst);
  const res = this.shelljs._('exec', script, defShellOpt);
  if (res.code === 0) {
    this.shelljs._('rm', '-f', script);
  }
  return res;
};

function gitemplateVar(key) { return 'gitemplate_' + key; }
function gitemplateEscVar(key) { return escapeRe(gitemplateVar(key)); }
function gitemplateEscVarCaseInsRe(key) { return new RegExp(gitemplateEscVar(key), 'i'); }
