/**
 * phaser <https://github.com/jonschlinkert/phaser>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var arrayify = module.exports = function(arr) {
  return !Array.isArray(arr) ? [arr] : arr;
};