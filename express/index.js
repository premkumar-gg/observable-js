let theExports = {};

theExports.HttpTracer = require('./src/http-tracer').HttpTracer;

if (!process.browser) {
  theExports.observe = require('./src/index').observe;
}

module.exports = theExports;
