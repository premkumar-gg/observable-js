const sinon = require('sinon');
const tracer = require('../src/tracer');
const assert = require('assert');

describe('tracer', function() {
  it ('has defaultOptions', () => {
    assert(typeof tracer.defaultOptions === 'object')
  });

  it ('has init function', () => {
    assert.equal(typeof tracer.init, 'function')
  });

  it ('has startHttpSpan function', () => {
    assert.equal(typeof tracer.startHttpSpan, 'function')
  });

  it ('has jaegerTracer field', () => {
    assert.equal(typeof tracer.jaegerTracer, 'object')
  });

  describe('.init', () => {
    var jaegerStartSpan = sinon.fake();
    var jaegerLog = sinon.fake();
    var jaegerTracer = { startSpan: jaegerStartSpan, log: jaegerLog };
    var initTracerFromEnv = sinon.fake.returns(jaegerTracer);
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

    it ('sets .startSpan from jaegerTracer', () => {
      var theTracer = tracer.init(
        jaegerCli,
        { config: {}, logger: {} }
      );

      assert.equal(theTracer.startSpan, jaegerStartSpan);
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

  describe('.startHttpSpan', () => {
    var jaegerStartSpan = sinon.fake();
    var jaegerLog = sinon.fake();
    var jaegerTracer = { startSpan: jaegerStartSpan, log: jaegerLog };
    var initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    var jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    const theReq = { url: '/something', method: 'GET' };

    beforeEach(() => {
      let theTracer = tracer.init(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startHttpSpan(theReq);
    });

    it('starts span with name "inboud_http_request"', () => {
      let theTracer = tracer.init(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startHttpSpan(theReq);

      sinon.assert.calledWith(
        jaegerStartSpan,
        'inbound_http_request'
      );
    });

    it('starts span with custom name if supplied', () => {
      let theTracer = tracer.init(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startHttpSpan(theReq, 'ex_span_name');

      sinon.assert.calledWith(
        jaegerStartSpan,
        'ex_span_name'
      );
    });

    it('calls tracer log with passed request', () => {
      let theTracer = tracer.init(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startHttpSpan(theReq);

      sinon.assert.calledWith(
        jaegerLog,
        theReq
      );
    })

  })
});
