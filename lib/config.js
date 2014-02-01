/**
 * phaser <https://github.com/jonschlinkert/phaser>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');

// node_modules
var findup = require('findup-sync');
var _ = require('lodash');

exports.init = function(config) {
  var pkg = {};
  try {
    pkg = require(findup('package.json', {cwd: process.cwd()}));

    // Load package.json unless an explicit config object is passed in,
    // or if options.config is defined as "false"
    if((config && !_.isEmpty(config)) || config === false) {
      pkg = config;
    }
  } catch (e) {
    e.origin = __filename;
    throw new Error(e.stack, 'No config object or "package.json" was found');
  }
  return pkg;
};