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

  it ('has getBaseTracer function', () => {
    assert.equal(typeof tracer.getBaseTracer, 'function')
  });

  describe('.init', () => {
    var jaegerStartSpan = sinon.fake();
    var jaegerLog = sinon.fake();
    var jaegerTracer = { startSpan: jaegerStartSpan, log: jaegerLog };
    var initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    var jaegerCli = { initTracerFromEnv: initTracerFromEnv };
    var checkConfig;

    beforeEach(() => {
      checkConfig = {
        serviceName: 'sample-app',
        sampler: {
          type: "const",
          param: 1,
        },
        reporter: {
          logSpans: true
        },
      };
    });

    it ('calls jaeger-client.initJaegerTracerFromEnv', () => {
      tracer.init(
        jaegerCli,
        { config: { serviceName: 'sample-app' } }
      );

      sinon.assert.calledWith(
        initTracerFromEnv,
        checkConfig,
        { logger: tracer.defaultOptions.logger }
      )
    });

    it ('takes default jaeger config if one is not supplied', () => {
      tracer.init(
        jaegerCli,
        { config: { serviceName: 'sample-app' } }
      );

      sinon.assert.calledWith(
        initTracerFromEnv,
        checkConfig,
        { logger: tracer.defaultOptions.logger }
      )
    });

    it ('allows overriding jaeger config', () => {
      checkConfig.sampler.type = 'probabilistic';

      tracer.init(
        jaegerCli,
        { config: checkConfig }
      );

      sinon.assert.calledWith(
        initTracerFromEnv,
        checkConfig,
        { logger: tracer.defaultOptions.logger }
      )
    });
  });

  describe('.startHttpSpan', () => {
    var jaegerLog = sinon.fake();
    var jaegerStartSpan = sinon.fake.returns({ log: jaegerLog});
    var jaegerTracer = { startSpan: jaegerStartSpan };
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
