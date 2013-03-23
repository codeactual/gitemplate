/**
 * Create a new Git repo from a templates in an existing repo.
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
var sprintf;
var fs;
var shelljs;
var exec;
var util;
var defShellOpt = {silent: true};

function Gitemplate() {
  this.settings = {
    name: null,
    json: {},
    repo: null
  };
}

configurable(Gitemplate.prototype);

/**
 * Apply collected configuration.
 */
Gitemplate.prototype.init = function() {
  var nativeRequire = this.get('nativeRequire');
  fs = nativeRequire('fs');
  shelljs = nativeRequire('shelljs');
  util = nativeRequire('util');
  sprintf = util.format;
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.cloneRepo = function() {
  return shelljs.exec(
    sprintf('git clone %s %s', this.get('src'), this.get('dst')),
    defShellOpt
  );
};

/**
 * Prep for new init and remote origin.
 */
Gitemplate.prototype.rmGitDir = function() {
  shelljs.rm('-rf', this.get('dst') + '/.git');
};

/**
 * Expand macros found in repo file content.
 */
Gitemplate.prototype.expandContentMacros = function() {
  var cmdHead = "find %s -type f -exec perl -p -i -e 's/\\{\\{";
  var cmdFoot = "\\}\\}/%s/g' {} \\;";
  var dst = this.get('dst');

  var res = shelljs.exec(
    sprintf(cmdHead + ESC_MACRO('name') + cmdFoot, dst, this.get('name')),
    defShellOpt
  );
  if (res.code !== 0) { return res; }

  res = shelljs.exec(
    sprintf(cmdHead + ESC_MACRO('year') + cmdFoot, dst, (new Date()).getFullYear()),
    defShellOpt
  );
  if (res.code !== 0) { return res; }

  var repo = this.get('repo');
  if (repo) {
    res = shelljs.exec(
      sprintf(cmdHead + ESC_MACRO('repo') + cmdFoot, dst, repo.replace('/', '\\/')),
      defShellOpt
    );
    if (res.code !== 0) { return res; }
  }

  var json = this.get('json');
  Object.keys(json).forEach(function(key) {
    res = shelljs.exec(
      sprintf(cmdHead + ESC_MACRO(key) + cmdFoot, dst, json[key]),
      defShellOpt
    );
    if (res.code !== 0) { return res; }
  });

  return res;
};

/**
 * Expand macros found in repo file names.
 */
Gitemplate.prototype.expandNameMacros = function() {
  var name = this.get('name');
  var dst = this.get('dst');

  var nameMacro = MACRO('name');
  var targets = shelljs.find(dst).filter(function(file) {
    return file.match(nameMacro);
  });
  targets.forEach(function(target) {
    shelljs.mv(target, target.replace(nameMacro, name));
  });

  var json = this.get('json');
  Object.keys(json).forEach(function(key) {
    var targets = shelljs.find(dst).filter(function(file) {
      return file.match(key);
    });
    targets.forEach(function(target) {
      shelljs.mv(target, target.replace(MACRO(key), json[key]));
    });
  });
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.initRepo = function() {
  shelljs.cd(this.get('dst'));
  return shelljs.exec('git init', defShellOpt);
};

/**
 * Set GitHub remote origin.
 */
Gitemplate.prototype.setGithubOrigin = function() {
  shelljs.cd(this.get('dst'));
  return shelljs.exec(
    sprintf('git remote add origin git@github.com:%s.git', this.get('repo')),
    defShellOpt
  );
};

function MACRO(key) {
  return 'gitemplate.' + key;
}
function ESC_MACRO(key) {
  return MACRO(key).replace(/\./, '\\.');
}
