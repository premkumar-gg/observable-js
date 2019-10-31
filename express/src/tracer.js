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
  options = Object.assign(defaultOptions, options);

  jaegerTracer = jaegerCli.initTracerFromEnv(options.config, {
    logger: options.logger
  });

  this.startSpan = jaegerTracer.startSpan;

  return this;
}

function startHttpSpan(req, name) {
  const theSpan = jaegerTracer.startSpan(name || 'inbound_http_request');
  jaegerTracer.log({ url: req.url, method: req.method });

  return theSpan;
}

module.exports = {
  init,
  defaultOptions,
  startHttpSpan,
  jaegerTracer
};
