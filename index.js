/**
 * Make a component from templates.
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

module.exports = {
  Compake: Compake,
  require: require
};

var configurable = require('configurable.js');

function Compake(fs) {
  this.settings = {
    fs: fs,
    name: '',

    // Match .compake.js options.
    license: ''
  };
}

configurable(Compake.prototype);

Compake.USER_CONFIG_PATH = process.env.HOME + '/.compake.js';

Compake.prototype.readUserConfig = function(path) {
  var self = this;
  var config = require(Compake.USER_CONFIG_PATH);
  Object.keys(config).forEach(function(key) {
    self.set(key, config[key]);
  });
};
