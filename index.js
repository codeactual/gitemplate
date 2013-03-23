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

var MACRO_NS = 'gitemplate.';
var MACRO_KEYS = ['name'];
var MACRO = {};
MACRO_KEYS.forEach(function(key) {
  MACRO[key] = MACRO_NS + key;
});

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

Gitemplate.prototype.rmGitDir = function() {
  shelljs.rm('-rf', this.get('dst') + '/.git');
};

Gitemplate.prototype.expandContentMacros = function() {
  return shelljs.exec(
    sprintf(
      "find %s -type f -exec perl -p -i -e 's/\\{\\{" +
        MACRO.name +
        "\\}\\}/%s/g' {} \\;",
      this.get('dst'),
      this.get('name')
    ),
    defShellOpt
  );
};

Gitemplate.prototype.expandNameMacros = function() {
  var name = this.get('name');
  var targets = shelljs.find(this.get('dst')).filter(function(file) {
    return file.match(MACRO.name);
  });
  for (var t = 0, target = ''; t < targets.length; t++) {
    target = targets[t];
    shelljs.mv(target, target.replace(MACRO.name, name));
  }
};
