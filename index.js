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

function Gitemplate(fs) {
  this.settings = {
    fs: fs,
    name: ''
  };
}

configurable(Gitemplate.prototype);

Gitemplate.USER_CONFIG_PATH = process.env.HOME + '/.gitemplate.js';

Gitemplate.prototype.readUserConfig = function(path) {
  var self = this;
  var config = require(Gitemplate.USER_CONFIG_PATH);
  Object.keys(config).forEach(function(key) {
    self.set(key, config[key]);
  });
};
