const mergeOptions = require('merge-options');

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

  return jaegerCli.initTracerFromEnv(options.config, {
    logger: options.logger
  });
}

module.exports = {
  init,
  defaultOptions
};
