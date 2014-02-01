/**
 * phaser <https://github.com/jonschlinkert/phaser>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var username = module.exports = function(str) {
  return str.replace(/^([^:]+):\/\/(?:.+)\/(.+)\/(?:.+)/, '$2');
};