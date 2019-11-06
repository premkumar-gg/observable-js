let mergeOptions = require('merge-options');

const defaultOptions = {
  config: {
    serviceName: 'express-app',
    sampler: {
      type: "const",
      param: 1,
    },
    reporter: {
      logSpans: true
    },
  },
  logger: {
    info: () => {},
    error: (msg) => {
      console.log("ERROR", msg);
    }
  },
};

function startSpan(name, fields, isDetached) {
  fields = fields || {};

  if (!isDetached && this.globalSpan) {
    fields.childOf = this.globalSpan;
  }

  return this.jaegerTracer.startSpan(name, fields);
}

function startParentHttpSpan(req, name) {
  const theSpan = this.jaegerTracer.startSpan(name || 'inbound_http_request');
  theSpan.log({ url: req.url, method: req.method });

  this.globalSpan = theSpan;

  return theSpan;
}

function getBaseTracer() {
  return this.jaegerTracer;
}

function Tracer(jaegerCli, options) {
  this.globalSpan = null;

  this.options = mergeOptions(defaultOptions, options);

  this.jaegerTracer = jaegerCli.initTracerFromEnv(this.options.config, {
    logger: this.options.logger
  });

  this.defaultOptions = defaultOptions;
  this.startParentHttpSpan = startParentHttpSpan;
  this.startSpan = startSpan;
  this.getBaseTracer = getBaseTracer;
}

module.exports = {
  Tracer
};
