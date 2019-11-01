const tracer = require('./tracer');
const app = require('./app');
const jaegerCli = require('jaeger-client');
let mergeOptions = require('merge-options');

const defaultOptions = {
  tracing: {}
};


function observe(server, options, aJaegerCli) {
  let theJaegerCli = aJaegerCli || jaegerCli;

  app.init(server);

  options = mergeOptions(defaultOptions, options);

  var observed = {
    tracer: null
  };

  if (options.tracing !== false) {
    var theTracer = tracer.init(theJaegerCli, options.tracing);
    app.setTracer(theTracer);

    observed.tracer = theTracer;
  }

  return observed;
}

module.exports = {
  observe
};
