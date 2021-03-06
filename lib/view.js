/*!
 * npm-api <https://github.com/doowb/npm-api>
 *
 * Copyright (c) 2016, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var url = require('url');
var utils = require('./utils');
var config = require('./config');

/**
 * View constructor. Create an instance of a view associated with a couchdb view in the npm registry.
 *
 * ```js
 * var view = new View('dependedUpon');
 * ```
 *
 * @param {String} `name` Name of couchdb view to use.
 * @returns {Object} instance of `View`
 * @api public
 */

function View (name) {
  if (!(this instanceof View)) {
    return new View(name);
  }
  this.name = name;
  this.config = utils.clone(config);
  this.config.pathname += '/_view/' + this.name;
}

/**
 * Query the couchdb view with the provided parameters.
 *
 * ```js
 * view.query({ group_level: 2, startkey: JSON.stringify(['micromatch']), endkey: JSON.stringify(['micromatch', {}])})
 *   .then(function(results) {
 *     console.log(results);
 *   }, function(err) {
 *     console.log(err);
 *   });
 * ```
 * @param  {Object} `params` URL query parameters to pass along to the couchdb view.
 * @return {Promise} Results of the query when promise is resolved.
 * @api public
 */

View.prototype.query = function(params) {
  return utils.co(function* (self) {
    params = params || {};
    return yield new Promise(function(resolve, reject) {
      var items = [];
      var header = {};
      utils.request(self.url(params))
        .once('error', reject)
        .pipe(utils.JSONStream.parse('rows.*'))
        .on('header', function(data) {
          header = data;
          if (header.error) {
            reject(new Error(header.reason || header.error));
          }
        })
        .on('data', function (data) {
          items.push(data);
        })
        .once('error', reject)
        .once('end', function () {
          resolve(items);
        });
    });
  }, this);
};

/**
 * Query the couchdb view with the provided parameters and return a stream of results.
 *
 * ```js
 * view.stream({ group_level: 2, startkey: JSON.stringify(['micromatch']), endkey: JSON.stringify(['micromatch', {}])})
 *   .on('data', function(data) {
 *     console.log(data);
 *   });
 * ```
 * @param  {Object} `params` URL query parameters to pass along to the couchdb view.
 * @return {Stream} Streaming results of the query.
 * @api public
 */

View.prototype.stream = function(params) {
  params = params || {};
  return utils.request(this.url(params))
    .pipe(utils.JSONStream.parse('rows.*'));
};

/**
 * Build a formatted url with the provided parameters.
 *
 * @param  {Object} `params` URL query parameters.
 * @return {String} formatted url string
 * @api public
 */

View.prototype.url = function(params) {
  return url.format(utils.merge({}, this.config, {query: params || {}}));
};

/**
 * Exposes `View`
 */

module.exports = View;
