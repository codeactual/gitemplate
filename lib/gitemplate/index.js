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
  create: function() { return new Gitemplate(); },
  mixin: function(ext) { extend(Gitemplate.prototype, ext); }
};

var util = require('util');
var sprintf = util.format;
var outerShelljs = require('outer-shelljs');
var nodeConsole = require('long-con');

var requireComponent = require('../component/require');
var configurable = requireComponent('configurable.js');
var extend = requireComponent('extend');
var escapeRe = requireComponent('escape-regexp');
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

  this.shelljs = outerShelljs.create();
  var nc = nodeConsole.create();
  nc.set('time', false);
  this.stdout = nc.create('gitemplate', console.log);
}

configurable(Gitemplate.prototype);

/**
 * Apply collected configuration.
 */
Gitemplate.prototype.init = function() {
  if (this.get('verbose')) {
    defShellOpt.silent = false;
  }

  if (!defShellOpt.silent) {
    this.shelljs.on('cmd', this.onShellCmd.bind(this));
  }
};

Gitemplate.prototype.onShellCmd = function(method, args, ret) {
  this.stdout('%s(%s)', method, JSON.stringify(args));
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.cloneRepo = function() {
  var dst = this.get('dst');
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
 * Prep for new init and remote origin.
 */
Gitemplate.prototype.rmGitDir = function() {
  this.shelljs._('rm', '-rf', this.get('dst') + '/.git');
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
    res = self.shelljs._(
      'exec',
      sprintf(cmdHead + ESC_TMPL_VAR(key) + cmdFoot, dst, escapeRe(self.get(key))),
      defShellOpt
    );
  });
  if (res.code !== 0) { return res; }

  var json = this.get('json');
  Object.keys(json).forEach(function(key) {
    res = self.shelljs._(
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
  var self = this;
  var name = this.get('name');
  var dst = this.get('dst');

  var nameVar = TMPL_VAR('name');
  function mvNameVar(target) {
    self.shelljs._('mv', target, target.replace(nameVar, name));
  }

  var targets = this.shelljs._('find', dst).filter(function(file) { // In dir names
    return self.shelljs._('test', '-d', file) && file.match(nameVar);
  });
  targets.forEach(mvNameVar);
  targets = this.shelljs._('find', dst).filter(function(file) { // In file names
    return self.shelljs._('test', '-f', file) && file.match(nameVar);
  });
  targets.forEach(mvNameVar);

  var json = this.get('json');
  var jsonKeys = Object.keys(json);
  jsonKeys.forEach(function(key) {
    var escapedKey = ESC_TMPL_VAR(key);
    function mvJsonVar(target) {
      self.shelljs._('mv', target, target.replace(TMPL_VAR(key), json[key]));
    }

    var targets = self.shelljs._('find', dst).filter(function(file) {
      return self.shelljs._('test', '-d', file) && file.match(escapedKey);
    });
    targets.forEach(mvJsonVar);
  });

  jsonKeys.forEach(function(key) {
    var escapedKey = ESC_TMPL_VAR(key);
    function mvJsonVar(target) {
      self.shelljs._('mv', target, target.replace(TMPL_VAR(key), json[key]));
    }

    var targets = self.shelljs._('find', dst).filter(function(file) {
      return self.shelljs._('test', '-f', file) && file.match(escapedKey);
    });
    targets.forEach(mvJsonVar);
  });
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.initRepo = function() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._('exec', 'git init', defShellOpt);
};

/**
 * Set GitHub remote origin.
 */
Gitemplate.prototype.setGithubOrigin = function() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._(
    'exec',
    sprintf('git remote add origin git@github.com:%s.git', this.get('repo')),
    defShellOpt
  );
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginSha = function() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._('exec', 'git rev-parse HEAD', defShellOpt).output.slice(0, 10);
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginUrl = function() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._('exec', 'git remote show origin', defShellOpt).output.match(/Fetch\s+URL: (\S+)/)[1];
};

/**
 * @return {string}
 */
Gitemplate.prototype.getRepoOriginSha = function() {
  this.shelljs._('cd', this.get('dst'));
  return this.shelljs._('exec', 'git rev-parse HEAD', defShellOpt).output.slice(0, 10);
};

/**
 * @return {object} shelljs exec() result.
 */
Gitemplate.prototype.runPostReplace = function() {
  var dst = this.get('dst');
  var script = dst + '/.gitemplate.postreplace';
  if (!this.shelljs._('test', '-e', script)) {
    return;
  }
  this.shelljs._('cd', dst);
  var res = this.shelljs._('exec', script, defShellOpt);
  if (res.code === 0) {
    this.shelljs._('rm', '-f', script);
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
