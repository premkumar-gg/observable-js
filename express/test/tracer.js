const sinon = require('sinon');
const Tracer = require('../src/tracer').Tracer;
const assert = require('assert');
const { FORMAT_HTTP_HEADERS } = require('opentracing');
const { ZipkinB3TextMapCodec } = require('jaeger-client');

describe('tracer', function() {

  var tracer;

  beforeEach(() => {
    var jaegerStartSpan = sinon.fake();
    var jaegerLog = sinon.fake();
    var jaegerTracer = { startSpan: jaegerStartSpan, log: jaegerLog };
    var initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    var jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    tracer = new Tracer(jaegerCli)
  });

  it ('has defaultOptions', () => {
    assert(typeof tracer.defaultOptions === 'object')
  });

  it ('has startParentHttpSpan function', () => {
    assert.equal(typeof tracer.startParentHttpSpan, 'function')
  });

  it ('has startSpan function', () => {
    assert.equal(typeof tracer.startSpan, 'function')
  });

  it ('has getBaseTracer function', () => {
    assert.equal(typeof tracer.getBaseTracer, 'function')
  });

  describe('Tracer constructor', () => {
    const jaegerStartSpan = sinon.fake();
    const jaegerLog = sinon.fake();
    const registerInjector = sinon.fake();
    const jaegerTracer = { startSpan: jaegerStartSpan, log: jaegerLog, registerInjector: registerInjector };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };
    let checkConfig;

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
      const tracer = new Tracer(jaegerCli,
        {config: {serviceName: 'sample-app'}});

      sinon.assert.calledWith(
        initTracerFromEnv,
        checkConfig,
        { logger: tracer.defaultOptions.logger }
      )
    });

    it ('takes default jaeger config if one is not supplied', () => {
      const tracer = new Tracer(jaegerCli,
        {config: {serviceName: 'sample-app'}});

      sinon.assert.calledWith(
        initTracerFromEnv,
        checkConfig,
        { logger: tracer.defaultOptions.logger }
      )
    });

    it ('allows overriding jaeger config', () => {
      checkConfig.sampler.type = 'probabilistic';

      const tracer = new Tracer(jaegerCli,
        {config: checkConfig});

      sinon.assert.calledWith(
        initTracerFromEnv,
        checkConfig,
        { logger: tracer.defaultOptions.logger }
      )
    });

    it ('when zipkinProjector option is set, registers injector for zipkin codec', () => {
      const tracer = new Tracer(jaegerCli,
        {zipkinProjector: true, config: {serviceName: 'sample-app'}});

      let codec = new ZipkinB3TextMapCodec({
        urlEncoding: true
      });

      sinon.assert.calledWith(
        registerInjector,
        FORMAT_HTTP_HEADERS,
        codec
      )
    })
  });

  describe('.startSpan', () => {
    const jaegerLog = sinon.fake();
    const jaegerSetTag = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({ log: jaegerLog, setTag: jaegerSetTag });
    const jaegerTracer = { startSpan: jaegerStartSpan, log: jaegerLog };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    let checkConfig;

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

    it ('forwards it to the base jaegerTracer', () => {
      const theTracer = new Tracer(
        jaegerCli,
        { config: checkConfig }
      );

      theTracer.startSpan('child_span', { some: 'thing' });
      sinon.assert.calledWith(
        jaegerStartSpan,
        'child_span',
        { some: 'thing' });
    });

    describe ('when called after .startParentHttpSpan', () => {
      let theTracer;
      let theParentSpan;

      beforeEach(() => {
        theTracer = new Tracer(
          jaegerCli,
          { config: {}, logger: {} }
        );

        theParentSpan = theTracer.startParentHttpSpan({url: '/something', method: 'GET'});
      });

      describe ('with an empty field set', () => {
        it ('sets childOf = theParentSpan', () => {
          theTracer.startSpan('child_span');

          sinon.assert.calledWith(
            jaegerStartSpan,
            'child_span',
            { childOf: theParentSpan });
        });

        it ('as detached span, does not set childOf = theParentSpan', () => {
          const isDetached = true;
          theTracer.startSpan('child_span', null, isDetached);

          sinon.assert.calledWith(
            jaegerStartSpan,
            'child_span',
            {});
        });

      });

      describe ('with a field set', () => {
        it ('sets childOf = theParentSpan', () => {
          theTracer.startSpan('child_span', { some: 'thing' });

          sinon.assert.calledWith(
            jaegerStartSpan,
            'child_span',
            { some: 'thing', childOf: theParentSpan });
        });

        it ('as detached span, does not set childOf = theParentSpan', () => {
          const isDetached = true;
          theTracer.startSpan('child_span', { some: 'thing' }, isDetached);

          sinon.assert.calledWith(
            jaegerStartSpan,
            'child_span',
            { some: 'thing' });
        });

      });
    });
  });

  describe('.startParentHttpSpan', () => {
    const jaegerSetTag = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({ setTag: jaegerSetTag });
    const jaegerTracer = { startSpan: jaegerStartSpan };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    const theReq = { url: '/something', method: 'GET' };

    it('starts span with name "inboud_http_request"', () => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theReq);

      sinon.assert.calledWith(
        jaegerStartSpan,
        'inbound_http_request'
      );
    });

    it('starts span with custom name if supplied', () => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theReq, 'ex_span_name');

      sinon.assert.calledWith(
        jaegerStartSpan,
        'ex_span_name'
      );
    });

    it('sets tag with passed request url and method', () => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theReq);

      sinon.assert.calledWith(
        jaegerSetTag,
        'http.url',
        theReq.url
      );

      sinon.assert.calledWith(
        jaegerSetTag,
        'http.method',
        theReq.method
      );
    })

  });

  describe('.startHttpSpan', () => {
    const jaegerSetTag = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({ setTag: jaegerSetTag });
    const jaegerInject = sinon.fake();
    const jaegerTracer = { startSpan: jaegerStartSpan, inject: jaegerInject };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    const theParentReq = { url: '/something', method: 'GET' };
    const theChildReq = { url: '/some-child', method: 'GET' };

    beforeEach(() => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theParentReq);
    });

    it('starts span with name "outbound_http_request"', () => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );

      let theHeaders = {};
      theTracer.startHttpSpan(theChildReq.url, theChildReq.method, theHeaders);

      sinon.assert.calledWith(
        jaegerStartSpan,
        'outbound_http_request'
      );
    });

    it('sets tag with passed request url and method', () => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      let theHeaders = {};
      theTracer.startHttpSpan(theChildReq.url, theChildReq.method, theHeaders);

      sinon.assert.calledWith(
        jaegerSetTag,
        'http.url',
        theChildReq.url
      );

      sinon.assert.calledWith(
        jaegerSetTag,
        'http.method',
        theChildReq.method
      );
    });

    it('injects headers with the span', () => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      let theHeaders = {};
      const theChildSpan = theTracer.startHttpSpan(theChildReq.url, theChildReq.method, theHeaders);

      sinon.assert.calledWith(
        jaegerInject,
        theChildSpan,
        sinon.match.any,
        {}
      );
    });

  });

  describe('.finishSpan', () => {
    const jaegerSetTag = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({ setTag: jaegerSetTag });
    const jaegerInject = sinon.fake();
    const jaegerTracer = { startSpan: jaegerStartSpan, inject: jaegerInject };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    const theParentReq = { url: '/something', method: 'GET' };
    const theChildReq = { url: '/some-child', method: 'GET' };
    var theTracer;

    beforeEach(() => {
      theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theParentReq);
    });

    it('calls the span\'s finish', () => {
      let theHeaders = {};
      var theChildSpan = theTracer.startHttpSpan(theChildReq.url, theChildReq.method, theHeaders);

      theChildSpan.finish = sinon.spy();

      theTracer.finishSpan(theChildSpan);

      sinon.assert.calledOnce(
        theChildSpan.finish
      );
    });
  });

  describe('.finishHttpSpan', () => {
    const jaegerSetTag = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({ setTag: jaegerSetTag });
    const jaegerInject = sinon.fake();
    const jaegerTracer = { startSpan: jaegerStartSpan, inject: jaegerInject };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    const theParentReq = { url: '/something', method: 'GET' };
    const theChildReq = { url: '/some-child', method: 'GET' };
    var theChildSpan;

    beforeEach(() => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theParentReq);

      let theHeaders = {};
      theChildSpan = theTracer.startHttpSpan(theChildReq.url, theChildReq.method, theHeaders);

      theChildSpan.finish = sinon.spy();

      theTracer.finishHttpSpan(theChildSpan, 200);
    });

    it('calls the span\'s finish', () => {
      sinon.assert.calledOnce(
        theChildSpan.finish
      );
    });

    it('sets status code as a span tag', () => {
      sinon.assert.calledWith(
        jaegerSetTag,
        'http.status_code',
        200
      );
    });
  });

  describe('.traceUrl', () => {
    const jaegerSetTag = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({ setTag: jaegerSetTag });
    const jaegerInject = sinon.fake();
    const jaegerTracer = { startSpan: jaegerStartSpan, inject: jaegerInject };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    var theTracer;

    it ('returns false if url is /metrics, by default', () => {
      theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );

      assert(!theTracer.traceUrl('/metrics'));
    });

    it ('returns false if url is /metrics, when blacklist URLs are configured', () => {
      theTracer = new Tracer(
        jaegerCli,
        { blacklistUrls: ["/some-url", "/some-other-url"], config: {}, logger: {} }
      );

      assert(!theTracer.traceUrl('/metrics'));
    });

    it ('returns false if url is configured as blacklist', () => {
      theTracer = new Tracer(
        jaegerCli,
        { blacklistUrls: ["/some-url", "/some-other-url"], config: {}, logger: {} }
      );

      assert(!theTracer.traceUrl('/some-url'));
      assert(!theTracer.traceUrl('/some-other-url'));
    });

    it ('returns false if url is configured as blacklist CSV', () => {
      theTracer = new Tracer(
        jaegerCli,
        { blacklistUrls: "/some-url, /some-other-url", config: {}, logger: {} }
      );

      assert(!theTracer.traceUrl('/some-url'));
      assert(!theTracer.traceUrl('/some-other-url'));
    });
  })
});
