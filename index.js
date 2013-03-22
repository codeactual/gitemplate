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
var util;
var defShellOpt = {async: true, silent: true};

function exec(cmd, cb) {
  shelljs.exec(cmd, defShellOpt, cb);
}

function Gitemplate() {
  this.settings = {
    name: null,
    fs: null,
    shelljs: null,
    util: null
  };
}

configurable(Gitemplate.prototype);

/**
 * Apply collected configuration.
 */
Gitemplate.prototype.init = function() {
  fs = this.get('fs');
  shelljs = this.get('shelljs');
  util = this.get('util');
  sprintf = util.format;
};

/**
 * @param {string} src Any valid `git clone` source.
 * @param {string} dst Local clone destination.
 */
Gitemplate.prototype.cloneRepo = function(src, dst, cb) {
  exec(sprintf('git clone %s %s', src, dst), cb);
};
