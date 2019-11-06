const sinon = require('sinon');
const Tracer = require('../src/tracer').Tracer;
const assert = require('assert');

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
  });

  describe('.startSpan', () => {
    const jaegerLog = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({log: jaegerLog });
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
    const jaegerLog = sinon.fake();
    const jaegerStartSpan = sinon.fake.returns({ log: jaegerLog});
    const jaegerTracer = { startSpan: jaegerStartSpan };
    const initTracerFromEnv = sinon.fake.returns(jaegerTracer);
    const jaegerCli = { initTracerFromEnv: initTracerFromEnv };

    const theReq = { url: '/something', method: 'GET' };

    beforeEach(() => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theReq);
    });

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

    it('calls tracer log with passed request', () => {
      let theTracer = new Tracer(
        jaegerCli,
        { config: {}, logger: {} }
      );
      theTracer.startParentHttpSpan(theReq);

      sinon.assert.calledWith(
        jaegerLog,
        theReq
      );
    })

  })
});
