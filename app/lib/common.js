'use strict';

module.exports = (() => {
  // Takes DB configuration object and returns db connection URI string
  // postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
  function pgConnURI(config) {
    let uri = ('postgresql://' + config.username + (
      config.password && config.password.length ? (':' + config.password) : ''
    ) + '@' + config.host + ':' + (config.port || 5432) + '/' + config.database);

    console.log('pgConnURI | uri:', uri)
    return uri;
  }

  return {
    pgConnURI
  };
} ());