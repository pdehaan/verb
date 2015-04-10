'use strict';

var chalk = require('chalk');
var symbol = require('log-symbols');
var through = require('through2');
var utils = require('../utils');
var _ = require('lodash');

module.exports = function() {
  var verb = this;

  console.log();
  console.log(chalk.yellow('Checking for conflicts…'));

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new utils.PluginError('conflicts plugin', 'Streaming is not supported.'));
      return cb();
    }

    var str = file.contents.toString();
    var res = helpers(str);
    var conflicting = problematic(verb, file, res);
    var h = {};

    if (!conflicting.length) {
      this.push(file);
      return cb();
    }

    var ctx = {};
    ctx.options = _.extend({}, verb.options, file.options);
    ctx.context = file.locals || {};
    ctx.app = verb;

    file.locals = file.locals || {};
    file.locals.__ = file.locals.__ || {};

    for (var i = 0; i < conflicting.length; i++) {
      var name = conflicting[i];
      file.content = namespace(file.content, name);
      var syncFn = verb._.helpers[name];
      if (syncFn) {
        h[name] = _.bind(syncFn, ctx);
        file.locals.__[name] = _.bind(syncFn, ctx);
        verb.helpers({__: h});
        delete verb._.helpers[name];
      }

      var asyncFn = verb._.asyncHelpers[name];
      if (asyncFn) {
        h[name] = _.bind(asyncFn, ctx);
        file.locals.__[name] = _.bind(asyncFn, ctx);
        verb.asyncHelpers({__: h});
        delete verb._.asyncHelpers[name];
      }

      if (!asyncFn && !syncFn) {
        h[name] = noop(name);
        file.locals.__[name] = noop(name);
        verb.helpers({__: h});
      }
    }

    file.contents = new Buffer(file.content);
    this.push(file);
    cb();
  });
};

function noop(name) {
  return function () {
    var msg = '';
    msg += 'ERROR! Cannot find the {%= ';
    msg += name;
    msg += '() %} helper. Helpers may be ';
    msg += 'registered using `verb.helper()`.';
    // console.log(chalk.red(msg));
  };
}

function namespace(str, name) {
  return str.split('{%= ' + name).join('{%= __.' + name);
}

function helpers(str) {
  var re = /\{%=\s*((?!__\.)[\w.]+)(?:\(\)|\(([^)]*?)\))\s*%}/gm;
  var res = [], match;

  while (match = re.exec(str)) {
    if (res.indexOf(match[1]) === -1) {
      res.push(match[1].trim());
    }
  }
  return res;
}

function problematic(verb, file, helpers) {
  var dataKeys = Object.keys(verb.cache.data);
  dataKeys = _.union(dataKeys, Object.keys(file.data));

  var registered = Object.keys(verb._.asyncHelpers);
  registered = _.union(registered, Object.keys(verb._.helpers));

  var h = [], d = [];
  var len = helpers.length;

  while (len--) {
    var helper = helpers[len];
    // if the helper name is also a data prop, it's a conflict
    if (dataKeys.indexOf(helper) !== -1) {
      d.push(helper);
    }

    // if the helper is not registered, it's a conflict
    if (registered.indexOf(helper) === -1) {
      h.push(helper);
    }
  }

  message(h, d);
  return _.union(h, d);
}


function message(h, d) {
  var hlen = h.length;
  var dlen = d.length;

  if (hlen === 0 && dlen === 0) {
    console.log(symbol.success + chalk.green('  no conflicts found.'));
    return;
  }

  if (hlen > 0) {
    console.log('  ' + symbol.error + ' ' + chalk.red(hlen + ' missing helper' + (hlen > 1 ? 's' : '') + ' found:'));
    var helpers = h.map(function (ele) {
      return ' - ' + ele + chalk.gray(' (is not registered)');
    }).join('\n');
    console.log(helpers);
  }

  if (dlen > 0) {
    console.log('  ' + symbol.error + ' ' + chalk.red(dlen + ' conflict' + (dlen > 1 ? 's' : '') + ' found:'));
    var props = d.map(function (ele) {
      return '  - ' + ele + chalk.gray(' (found both a helper and a data property with this name)');
    }).join('\n  ');
    console.log(props);
  }
}