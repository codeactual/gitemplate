/**
 * Git cloning with template variables.
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

module.exports = {
  Gitemplate: Gitemplate,
  mixin: mixin,
  require: require
};

var configurable = require('configurable.js');
var escapeRe = require('escape-regexp');
var util;
var sprintf;
var shelljs;
var defShellOpt = {silent: true};

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
}

configurable(Gitemplate.prototype);

/**
 * Apply collected configuration.
 */
Gitemplate.prototype.init = function() {
  var nativeRequire = this.get('nativeRequire');
  util = nativeRequire('util');
  sprintf = util.format;
  shelljs = require('outer-shelljs').create(nativeRequire('shelljs'));

  if (this.get('verbose')) {
    defShellOpt.silent = false;
  }

  if (!defShellOpt.silent) {
    shelljs.on('cmd', this.onShellCmd);
  }
};

Gitemplate.prototype.onShellCmd = function(method, args, ret) {
  util.debug(sprintf( // Use debug() over log() to block.
    '[%s] %s(%s)',
    (new Date()).toUTCString(), method, JSON.stringify(args)
  ));
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.cloneRepo = function() {
  var dst = this.get('dst');
  if (shelljs._('test', '-e', dst)) {
    return {code: 1, output: 'Destination already exists'};
  }
  return shelljs._(
    'exec',
    sprintf('git clone %s %s', this.get('src'), dst),
    defShellOpt
  );
};

/**
 * Prep for new init and remote origin.
 */
Gitemplate.prototype.rmGitDir = function() {
  shelljs._('rm', '-rf', this.get('dst') + '/.git');
};

/**
 * Replace macros found in repo file content.
 */
Gitemplate.prototype.replaceContentVars = function() {
  var cmdHead = "find %s -type f -exec perl -p -i -e 's/";
  var cmdFoot = "/%s/gi' {} \\;";
  var dst = this.get('dst');
  var passThruKeys = ['name', 'desc', 'repo', 'year', 'originSha', 'originUrl'];
  var res = {code: 0};
  var self = this;

  passThruKeys.forEach(function(key) {
    if (res.code !== 0) { // Prior exec() failed, bail out.
      return;
    }
    res = shelljs._(
      'exec',
      sprintf(cmdHead + ESC_TMPL_VAR(key) + cmdFoot, dst, escapeRe(self.get(key))),
      defShellOpt
    );
  });
  if (res.code !== 0) { return res; }

  var json = this.get('json');
  Object.keys(json).forEach(function(key) {
    res = shelljs._(
      'exec',
      sprintf(cmdHead + ESC_TMPL_VAR(key) + cmdFoot, dst, escapeRe(json[key])),
      defShellOpt
    );
    if (res.code !== 0) { return res; }
  });

  return res;
};

/**
 * Replace macros found in repo file names.
 */
Gitemplate.prototype.replaceNameVars = function() {
  var name = this.get('name');
  var dst = this.get('dst');

  var nameVar = TMPL_VAR('name');
  function mvNameVar(target) { shelljs._('mv', target, target.replace(nameVar, name)); }

  var targets = shelljs._('find', dst).filter(function(file) { // In dir names
    return shelljs._('test', '-d', file) && file.match(nameVar);
  });
  targets.forEach(mvNameVar);
  targets = shelljs._('find', dst).filter(function(file) { // In file names
    return shelljs._('test', '-f', file) && file.match(nameVar);
  });
  targets.forEach(mvNameVar);

  var json = this.get('json');
  var jsonKeys = Object.keys(json);
  jsonKeys.forEach(function(key) {
    var escapedKey = ESC_TMPL_VAR(key);
    function mvJsonVar(target) { shelljs._('mv', target, target.replace(TMPL_VAR(key), json[key])); }

    var targets = shelljs._('find', dst).filter(function(file) {
      return shelljs._('test', '-d', file) && file.match(escapedKey);
    });
    targets.forEach(mvJsonVar);
  });

  jsonKeys.forEach(function(key) {
    var escapedKey = ESC_TMPL_VAR(key);
    function mvJsonVar(target) { shelljs._('mv', target, target.replace(TMPL_VAR(key), json[key])); }

    var targets = shelljs._('find', dst).filter(function(file) {
      return shelljs._('test', '-f', file) && file.match(escapedKey);
    });
    targets.forEach(mvJsonVar);
  });
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.initRepo = function() {
  shelljs._('cd', this.get('dst'));
  return shelljs._('exec', 'git init', defShellOpt);
};

/**
 * Set GitHub remote origin.
 */
Gitemplate.prototype.setGithubOrigin = function() {
  shelljs._('cd', this.get('dst'));
  return shelljs._(
    'exec',
    sprintf('git remote add origin git@github.com:%s.git', this.get('repo')),
    defShellOpt
  );
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginSha = function() {
  shelljs._('cd', this.get('dst'));
  return shelljs._('exec', 'git rev-parse HEAD', defShellOpt).output.slice(0, 10);
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginUrl = function() {
  shelljs._('cd', this.get('dst'));
  return shelljs._('exec', 'git remote show origin', defShellOpt).output.match(/Fetch\s+URL: (\S+)/)[1];
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginSha = function() {
  shelljs._('cd', this.get('dst'));
  return shelljs._('exec', 'git rev-parse HEAD', defShellOpt).output.slice(0, 10);
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.runPostReplace = function() {
  var dst = this.get('dst');
  var script = dst + '/.gitemplate.postreplace';
  if (!shelljs._('test', '-e', script)) {
    return;
  }
  shelljs._('cd', dst);
  var res = shelljs._('exec', script, defShellOpt);
  if (res.code === 0) {
    shelljs._('rm', '-f', script);
  }
  return res;
};

/**
 * Mix the given function set into Gitemplate's prototype.
 *
 * @param {object} ext
 */
function mixin(ext) {
  Object.keys(ext).forEach(function(key) {
    if (typeof ext[key] === 'function') {
      Gitemplate.prototype[key] = ext[key];
    }
  });
}

function TMPL_VAR(key) {
  return 'gitemplate_' + key;
}
function ESC_TMPL_VAR(key) {
  return escapeRe(TMPL_VAR(key));
}
