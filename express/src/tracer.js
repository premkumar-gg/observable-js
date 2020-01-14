let mergeOptions = require('merge-options');
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');
const { ZipkinB3TextMapCodec } = require('jaeger-client');

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

function startHttpSpan(url, method, headers) {
  if (process && process.browser) {
    return null;
  }

  headers = headers || {};

  let theChildSpan = this.startSpan('outbound_http_request');
  theChildSpan.setTag(Tags.HTTP_URL, url);
  theChildSpan.setTag(Tags.HTTP_METHOD, method);
  this.jaegerTracer.inject(theChildSpan, FORMAT_HTTP_HEADERS, headers);

  return theChildSpan;
}

function finishSpan(theSpan) {
  if (!(theSpan && process && !process.browser)) {
    return;
  }

  theSpan.finish();
}

function finishHttpSpan(theSpan, statusCode) {
  if (!(theSpan && process && !process.browser)) {
    return;
  }

  if (statusCode) {
    theSpan.setTag(Tags.HTTP_STATUS_CODE, statusCode);
  }

  theSpan.finish();
}

function startParentHttpSpan(req, name) {
  const theSpan = this.jaegerTracer.startSpan(name || 'inbound_http_request');
  theSpan.setTag(Tags.HTTP_URL, req.url);
  theSpan.setTag(Tags.HTTP_METHOD, req.method);

  this.globalSpan = theSpan;

  return theSpan;
}

function traceUrl(checkUrl) {
  let theBlacklistUrls = this.options.blacklistUrls;

  if (!theBlacklistUrls) {
    theBlacklistUrls = [];
  }

  if (typeof theBlacklistUrls === 'string') {
    theBlacklistUrls = theBlacklistUrls.split(',');
  }

  theBlacklistUrls = theBlacklistUrls.map(x => x.trim());
  theBlacklistUrls.push('/metrics');

  return !theBlacklistUrls.some(aURL => aURL === checkUrl);
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

  if (this.options.zipkinProjector) {
    let codec = new ZipkinB3TextMapCodec({
      urlEncoding: true
    });

    this.jaegerTracer.registerInjector(FORMAT_HTTP_HEADERS, codec);
  }

  this.defaultOptions = defaultOptions;
  this.startParentHttpSpan = startParentHttpSpan;
  this.startSpan = startSpan;
  this.getBaseTracer = getBaseTracer;
  this.startHttpSpan = startHttpSpan;
  this.finishSpan = finishSpan;
  this.finishHttpSpan = finishHttpSpan;
  this.traceUrl = traceUrl;
}

module.exports = {
  Tracer
};
