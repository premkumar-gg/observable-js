let mergeOptions = require('merge-options');
let jaegerTracer = null;

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

function init(jaegerCli, options) {
  options = mergeOptions(defaultOptions, options);

  jaegerTracer = jaegerCli.initTracerFromEnv(options.config, {
    logger: options.logger
  });

  return this;
}

function startHttpSpan(req, name) {
  const theSpan = jaegerTracer.startSpan(name || 'inbound_http_request');
  theSpan.log({ url: req.url, method: req.method });

  return theSpan;
}

function getBaseTracer() {
  return jaegerTracer;
}

module.exports = {
  init,
  defaultOptions,
  startHttpSpan,
  getBaseTracer
};
