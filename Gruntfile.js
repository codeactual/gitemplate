module.exports = function(grunt) {
  'use strict';

  require('grunt-horde')
    .create(grunt)
    .demand('projName', 'gitemplate')
    .demand('instanceName', 'gitemplate')
    .demand('klassName', 'Gitemplate')
    .loot('node-component-grunt')
    .attack();
};
