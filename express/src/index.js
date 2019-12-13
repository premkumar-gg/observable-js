const Tracer = require('./tracer').Tracer;
const Metrics = require('./metrics').Metrics;
const App = require('./app').App;
const jaegerCli = require('jaeger-client');
const tricorder = require('../lib/tricorder');
let mergeOptions = require('merge-options');

const defaultOptions = {
  tracing: {},
  metrics: {}
};


function observe(server, options, aJaegerCli, aTricorder) {
  let theJaegerCli = aJaegerCli || jaegerCli;
  let theTricorder = aTricorder || tricorder;

  let app = new App(server);

  options = mergeOptions(defaultOptions, options);

  const observed = {
    tracer: null,
    metrics: null
  };

  if (options.tracing !== false) {
    const theTracer = new Tracer(theJaegerCli, options.tracing);
    app.setTracer(theTracer);

    observed.tracer = theTracer;
  }

  if (options.metrics !== false) {
    const theMetrics = new Metrics(theTricorder);
    app.setMetrics(theMetrics);

    observed.metrics = theMetrics;
  }

  return observed;
}

module.exports = {
  observe
};
