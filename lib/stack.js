'use strict';

/**
 * Module dependencies.
 */

var through = require('through2');
var sessionify = require('sessionify');
var drafts = require('gulp-drafts');
var es = require('event-stream');
var vfs = require('vinyl-fs');
var _ = require('lodash');

/**
 * Local dependencies
 */

var plugins = require('./plugins');
var session = require('./session');

/**
 * Default `src` plugins to run.
 *
 * To disable a plugin:
 *
 * ```js
 * app.disable('src:foo plugin');
 * ```
 */

exports.src = function(app, glob, opts) {
  opts = _.merge({}, app.options, opts);
  session.set('src', opts);

  return createStack(app, {
    'src:vfs': vfs.src(glob, opts),
    'src:init': plugins.init.call(app, opts),
    'src:conflicts': plugins.conflicts.call(app, opts),
    'src:drafts': drafts.call(app, opts)
  });
};

/**
 * Default `dest` plugins to run.
 *
 * To disable a plugin:
 *
 * ```js
 * app.disable('dest:bar plugin');
 * ```
 */

exports.dest = function (app, dest, opts) {
  var srcOpts = session.get('src') || {};
  opts = _.merge({}, app.options, srcOpts, opts);

  return createStack(app, {
    'dest:paths': plugins.dest.call(app, dest, opts, opts.locals),
    'dest:render': plugins.render.call(app, opts, opts.locals),
    'dest:reflinks': plugins.reflinks.call(app, opts, opts.locals),
    'dest:comments': plugins.comments.call(app),
    'dest:format': plugins.format.call(app, opts, opts.locals),
    'dest:vfs': vfs.dest(dest, opts)
  });
};

/**
 * Create the default plugin stack based on user settings.
 *
 * Disable a plugin by passing the name of the plugin + ` plugin`
 * to `app.disable()`,
 *
 * **Example:**
 *
 * ```js
 * app.disable('src:foo plugin');
 * app.disable('src:bar plugin');
 * ```
 */

function createStack(app, plugins) {
  if (app.enabled('minimal config')) {
    var res = es.pipe.apply(es, []);
    return sessionify(res, session, app);
  }
  function enabled(acc, plugin, name) {
    if (plugin == null) {
      acc.push(through.obj());
    }
    if (app.enabled(name + ' plugin')) {
      acc.push(plugin);
    }
    return acc;
  }
  var arr = _.reduce(plugins, enabled, []);
  var result = es.pipe.apply(es, arr);
  return sessionify(result, session, app);
}
