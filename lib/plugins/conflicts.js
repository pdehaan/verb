'use strict';

var chalk = require('chalk');
var PluginError = require('plugin-error');
var symbol = require('log-symbols');
var through = require('through2');
var get = require('get-value');
var _ = require('lodash');

module.exports = plugin('verb', 'conflicts');

function plugin(appname, name, config) {
  var pluginname = appname + '-' + name;

  return function conflictsPlugin(options) {
    options = _.extend({}, config, options);
    var app = this;

    var conflicts = app.get('argv.conflicts');
    var verbose = app.get('argv.verbose');

    if (conflicts && verbose) {
      console.log();
      console.log(chalk.yellow('Checking for conflicts…'));
    }

    return through.obj(function (file, enc, cb) {
      if (file.isNull()) {
        this.push(file);
        return cb();
      }

      if (file.isStream()) {
        this.emit('error', new PluginError(pluginname, 'Streaming is not supported.'));
        return cb();
      }

      var str = file.contents.toString();
      var res = helpers(str);
      var conflicting = problematic(app, file, res, verbose);
      var h = {};

      if (!conflicting.length) {
        this.push(file);
        return cb();
      }

      var ctx = {};
      ctx.options = _.extend({}, app.options, file.options);
      ctx.context = file.locals || {};
      ctx.config = app.config;
      ctx.app = app;

      file.locals = file.locals || {};
      file.locals.__ = file.locals.__ || {};

      for (var i = 0; i < conflicting.length; i++) {
        var name = conflicting[i];
        file.content = namespace(file.content, name);
        var syncFn = get(app._.helpers, name);
        if (syncFn) {
          h[name] = _.bind(syncFn, ctx);
          file.locals.__[name] = _.bind(syncFn, ctx);
          app.helpers({__: h});
          delete app._.helpers[name];
        }

        var asyncFn = get(app._.asyncHelpers, name);
        if (asyncFn) {
          h[name] = _.bind(asyncFn, ctx);
          file.locals.__[name] = _.bind(asyncFn, ctx);
          app.asyncHelpers({__: h});
          delete app._.asyncHelpers[name];
        }

        if (!asyncFn && !syncFn) {
          h[name] = noop(name);
          file.locals.__[name] = noop(name);
          app.helpers({__: h});
        }
      }

      file.contents = new Buffer(file.content);
      this.push(file);
      cb();
    });
  };

}

function noop(name) {
  return function () {
    var msg = '';
    msg += 'ERROR! Cannot find the {%= ';
    msg += name;
    msg += '() %} helper. Helpers may be ';
    msg += 'registered using `app.helper()`.';
    // console.log(chalk.red(msg));
  };
}

function namespace(str, name) {
  return str.split('{%= ' + name).join('{%= __.' + name);
}

function helpers(str) {
  var re = /\{%=\s*((?!__\.)[\w.]+)(?:\(\)|\(([^)]*?)\))\s*%}/gm;
  var res = [],
    match;

  while (match = re.exec(str)) {
    if (res.indexOf(match[1]) === -1) {
      res.push(match[1].trim());
    }
  }
  return res;
}

function problematic(app, file, helpers, verbose) {
  var dataKeys = Object.keys(app.cache.data);
  dataKeys = _.union(dataKeys, Object.keys(file.data));

  var registered = Object.keys(app._.asyncHelpers);
  registered = _.union(registered, Object.keys(app._.helpers));

  var h = [],
    d = [];
  var len = helpers.length;

  while (len--) {
    var helper = helpers[len];
    // if the helper name is also a data prop, it's a conflict
    if (dataKeys.indexOf(helper) !== -1 && helper.indexOf('.') === -1) {
      d.push(helper);
    }

    // if the helper is not registered, it's a conflict
    if (registered.indexOf(helper) === -1 && helper.indexOf('.') === -1) {
      h.push(helper);
    }
  }

  message(h, d, verbose, file);
  return _.union(h, d);
}

function message(h, d, verbose, file) {
  if (!verbose) return;
  var fp = file.path.split(/[\\\/]/).slice(-2).join('/');

  var hlen = h.length;
  var dlen = d.length;

  if (hlen > 0) {
    console.log(symbol.error, '', chalk.red(hlen + ' missing helper' + s(hlen) + ' found in', fp));
    h.forEach(function (ele) {
      console.log('   -', ele);
    });
    console.log();
  }

  if (dlen > 0) {
    console.log(symbol.warning, '', chalk.yellow(dlen + ' data/helper conflict' + s(dlen) + ' found in', fp));
    d.forEach(function (ele) {
      console.log('   -', ele);
    });
    console.log();
  }
}

function s(len) {
  return len > 1 ? 's' : '';
}
