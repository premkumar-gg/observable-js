const sinon = require('sinon');
const tracer = require('../src/tracer');
const assert = require('assert');

describe('tracer', function() {
  it ('has defaultOptions', () => {
    assert(typeof tracer.defaultOptions === 'object')
  });

  it ('has init function', () => {
    assert(typeof tracer.init === 'function')
  });

  describe('.init', () => {
    var initTracerFromEnv = sinon.fake();
    var jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    it ('calls jaeger-client.initJaegerTracerFromEnv', () => {
      tracer.init(
        jaegerCli,
        { config: {}, logger: {} }
      );

      sinon.assert.calledWith(
        initTracerFromEnv,
        tracer.defaultOptions.config,
        { logger: tracer.defaultOptions.logger }
      )
    });

    it ('allows overriding jaeger config', () => {
      const theOptions = {
        config: {
          serviceName: 'sample-app',
          sampler: {
            type: 'probabilistic'
          },
          reporter: {
            logSpans: false
          }
        }, logger: {}
      };

      tracer.init(
        jaegerCli,
        theOptions
      );

      var checkConfig = tracer.defaultOptions.config;
      checkConfig.serviceName = 'sample-app';
      checkConfig.sampler.type = 'probabilistic';
      checkConfig.reporter.logSpans = false;

      sinon.assert.calledWith(
        initTracerFromEnv,
        checkConfig,
        { logger: tracer.defaultOptions.logger }
      )
    });
  })
});
