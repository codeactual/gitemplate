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
  shelljs = nativeRequire('shelljs');

  if (this.get('verbose')) {
    defShellOpt.silent = false;
  }
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.cloneRepo = function() {
  var dst = this.get('dst');
  if (shell('test', '-e', dst)) {
    return {code: 1, output: 'Destination already exists'};
  }
  return shell(
    'exec',
    sprintf('git clone %s %s', this.get('src'), dst),
    defShellOpt
  );
};

/**
 * Prep for new init and remote origin.
 */
Gitemplate.prototype.rmGitDir = function() {
  shell('rm', '-rf', this.get('dst') + '/.git');
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
    res = shell(
      'exec',
      sprintf(cmdHead + ESC_TMPL_VAR(key) + cmdFoot, dst, escapeRe(self.get(key))),
      defShellOpt
    );
  });
  if (res.code !== 0) { return res; }

  var json = this.get('json');
  Object.keys(json).forEach(function(key) {
    res = shell(
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
  var targets = shell('find', dst).filter(function(file) {
    return file.match(nameVar);
  });
  targets.forEach(function(target) {
    shell('mv', target, target.replace(nameVar, name));
  });

  var json = this.get('json');
  Object.keys(json).forEach(function(key) {
    var targets = shell('find', dst).filter(function(file) {
      return file.match(ESC_TMPL_VAR(key));
    });
    targets.forEach(function(target) {
      shell('mv', target, target.replace(TMPL_VAR(key), json[key]));
    });
  });
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.initRepo = function() {
  shell('cd', this.get('dst'));
  return shell('exec', 'git init', defShellOpt);
};

/**
 * Set GitHub remote origin.
 */
Gitemplate.prototype.setGithubOrigin = function() {
  shell('cd', this.get('dst'));
  return shell(
    'exec',
    sprintf('git remote add origin git@github.com:%s.git', this.get('repo')),
    defShellOpt
  );
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginSha = function() {
  shell('cd', this.get('dst'));
  return shell('exec', 'git rev-parse HEAD', defShellOpt).output.slice(0, 10);
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginUrl = function() {
  shell('cd', this.get('dst'));
  return shell('exec', 'git remote show origin', defShellOpt).output.match(/Fetch\s+URL: (\S+)/)[1];
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginSha = function() {
  shell('cd', this.get('dst'));
  return shell('exec', 'git rev-parse HEAD', defShellOpt).output.slice(0, 10);
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.runPostReplace = function() {
  var dst = this.get('dst');
  var script = dst + '/.gitemplate.postreplace';
  if (!shell('test', '-e', script)) {
    return;
  }
  shell('cd', dst);
  var res = shell('exec', script, defShellOpt);
  if (res.code === 0) {
    shell('rm', '-f', script);
  }
  return res;
};

/**
 * shelljs.* wrapper().
 */
function shell(method) {
  var args = [].slice.call(arguments, 1);
  if (!defShellOpt.silent) {
    util.debug(sprintf('%s(%s)', method, JSON.stringify(args)));
  }
  return shelljs[method].apply(shelljs, args);
}

function TMPL_VAR(key) {
  return 'gitemplate_' + key;
}
function ESC_TMPL_VAR(key) {
  return escapeRe(TMPL_VAR(key));
}
