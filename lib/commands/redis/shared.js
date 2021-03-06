'use strict';
let Heroku = require('heroku-client');
let cli = require('heroku-cli-util');

const HOST  = process.env.HEROKU_REDIS_HOST || 'redis-api.heroku.com' ;
const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis';
const REDIS_PATH_BASE = '/redis/v0/databases';
const CLIENT_PATH_BASE = '/client/v11/databases';

function request(context, path, method, body) {
  let headers = { 'Accept': 'application/json' };
  if (process.env.HEROKU_HEADERS) {
    cli.extend(headers, JSON.parse(process.env.HEROKU_HEADERS));
  }
  return Heroku.request( {
    method: method || 'GET',
    path: path,
    host: HOST,
    auth: `${context.auth.username}:${context.auth.password}`,
    headers: headers,
    body: body
  });
}

function make_addons_filter(filter) {
  if (filter) {
    filter = filter.toUpperCase();
  }

  function matches(addon) {
    for (let i = 0; i < addon.config_vars.length; i++) {
      let cfg_name = addon.config_vars[i].toUpperCase();
      if (cfg_name.indexOf(filter) >= 0) {
        return true;
      }
    }
    if (addon.name.toUpperCase().indexOf(filter) >= 0) {
      return true;
    }
    return false;
  }

  function on_response(addons) {
    let redis_addons = [];
    for (let i = 0; i < addons.length; i++) {
      let addon = addons[i];
      let service = addon.addon_service.name;

      if (service.indexOf(ADDON) === 0 && (!filter || matches(addon))) {
        redis_addons.push(addon);
      }
    }
    return redis_addons;
  }

  return on_response;
}

module.exports = {
  REDIS_PATH_BASE: REDIS_PATH_BASE,
  CLIENT_PATH_BASE: CLIENT_PATH_BASE,
  request: request,
  make_addons_filter: make_addons_filter
};
