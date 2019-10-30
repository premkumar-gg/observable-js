const tracer = require("./tracer");
const mergeOptions = require('merge-options');
const jaegerCli = require('jaeger-client');

const defaultOptions = {
  tracing: {}
};

function isExpressObject(server) {
  if (!('get' in server && 'post' in server)) {
    return false;
  }

  return typeof server['get'] === 'function' && typeof server['post'] === 'function';
}

function observe(server, options, aJaegerCli) {
  let theJaegerCli = aJaegerCli || jaegerCli;

  if ( ! isExpressObject(server)) {
    throw Error('server is not an express app');
  }

  options = mergeOptions(defaultOptions, options);
  tracer.init(theJaegerCli, options.tracing);
}

module.exports = {
  observe
};
