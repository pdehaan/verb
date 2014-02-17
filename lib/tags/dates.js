/**
 * phaser <https://github.com/jonschlinkert/phaser>
 * The most deadly markdown documentation generator in the Alpha Quadrant.
 *
 * Copyright (c) 2014 Jon Schlinkert, Brian Woodward, contributors.
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Date functions used in _.date() filter
 *
 * @name formatDate
 * @param  {Object} dateobj The date object to format.
 * @param  {String} structure The structure to use, e.g. 'YYYY-MM-DD'.
 *
 * @return {String} The formatted date.
 * @api public
 */

module.exports = function () {

  exports.year = function() {
    return new Date().getFullYear();
  };

  exports.month = function() {
    var dateobj = new Date();
    var month = ('0' + (dateobj.getMonth() + 1)).slice(-2);
    var months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return months[parseInt(month) - 1];
  };

  exports.weekday = function() {
    var day = new Date().getDay();
    var weekday = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wendesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    return weekday[parseInt(day)];
  };

  exports.hours = function() {
    return ('0' + new Date().getHours()).slice(-2);
  };

  exports.minutes = function() {
    return ('0' + new Date().getMinutes()).slice(-2);
  };

  exports.seconds = function() {
    return ('0' + new Date().getSeconds()).slice(-2);
  };

  return exports;
};