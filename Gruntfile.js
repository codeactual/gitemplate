module.exports = function exports(grunt) {
  'use strict';

  require('grunt-horde')
    .create(grunt)
    .demand('initConfig.projName', 'gitemplate')
    .demand('initConfig.instanceName', 'gitemplate')
    .demand('initConfig.klassName', 'Gitemplate')
    .loot('node-component-grunt')
    .attack();
};
