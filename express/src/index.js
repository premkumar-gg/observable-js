const Tracer = require('./tracer').Tracer;
const App = require('./app').App;
const jaegerCli = require('jaeger-client');
let mergeOptions = require('merge-options');

const defaultOptions = {
  tracing: {}
};


function observe(server, options, aJaegerCli) {
  let theJaegerCli = aJaegerCli || jaegerCli;

  let app = new App(server);

  options = mergeOptions(defaultOptions, options);

  var observed = {
    tracer: null
  };

  if (options.tracing !== false) {
    var theTracer = new Tracer(theJaegerCli, options.tracing);
    app.setTracer(theTracer);

    observed.tracer = theTracer;
  }

  return observed;
}

module.exports = {
  observe
};
