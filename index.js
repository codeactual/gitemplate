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
    name: null
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
  exec = shelljs.exec;
  util = nativeRequire('util');
  sprintf = util.format;
};

/**
 * @param {string} src Any valid `git clone` source.
 * @param {string} dst Local clone destination.
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.cloneRepo = function(src, dst) {
  return exec(sprintf('git clone %s %s', src, dst), defShellOpt);
};

/**
 * @param {string} dst Local clone destination.
 */
Gitemplate.prototype.rmGitDir = function(dst) {
  shelljs.rm('-rf', dst + '/.git');
};
