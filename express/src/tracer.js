let mergeOptions = require('merge-options');
let jaegerTracer = null;
let globalSpan = null;
let _this = null;

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

  if (!isDetached && _this.globalSpan) {
    fields.childOf = _this.globalSpan;
  }

  return jaegerTracer.startSpan(name, fields);
}

function startParentHttpSpan(req, name) {
  const theSpan = jaegerTracer.startSpan(name || 'inbound_http_request');
  theSpan.log({ url: req.url, method: req.method });

  _this.globalSpan = theSpan;

  return theSpan;
}

function getBaseTracer() {
  return jaegerTracer;
}

function init(jaegerCli, options) {
  options = mergeOptions(defaultOptions, options);

  jaegerTracer = jaegerCli.initTracerFromEnv(options.config, {
    logger: options.logger
  });

  _this = this;

  return this;
}

module.exports = {
  init,
  defaultOptions,
  startParentHttpSpan,
  startSpan,
  getBaseTracer
};
