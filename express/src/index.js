const tracer = require('./tracer');
const app = require('./app');
const jaegerCli = require('jaeger-client');

const defaultOptions = {
  tracing: {}
};


function observe(server, options, aJaegerCli) {
  let theJaegerCli = aJaegerCli || jaegerCli;

  app.init(server);

  options = Object.assign(defaultOptions, options);

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
