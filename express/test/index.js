const observable = require('../src/index');
const express = require('express');
const app = express();
const assert = require('assert');
const sinon = require('sinon');

describe('observable', function() {

  var mockTracer = { doSomething: () => {} };
  var initTracerFromEnv = sinon.fake.returns(mockTracer);
  var jaegerCli = { initTracerFromEnv: initTracerFromEnv };
  var instrument = sinon.fake();
  var tricorder = { instrument: instrument };

  describe('".observe" takes express app param', function() {
    it('valid app works good', function() {
      const observed = observable.observe(app, {}, jaegerCli, tricorder);
      assert(!!observed.tracer);
    });

    it ('invalid app throws exception', function() {
      var app1 = { randomStuff: {} };
      assert.throws(() => { observable.observe(app1, {}, jaegerCli, tricorder) }, Error);
    });
  });

  describe('".observe" can optionally', function() {
    it('disable tracing', function() {
      const observed = observable.observe(app, { tracing: false }, jaegerCli, tricorder);
      assert.equal(observed.tracer, null);
    })

    it('disable metrics', function() {
      const observed = observable.observe(app, { metrics: false }, jaegerCli, tricorder);
      assert.equal(observed.metrics, null);
    })
  });

  it ('when metrics is not disabled, calls tricorder.instrument', function() {
    const observed = observable.observe(app, { tracing: false },  jaegerCli, tricorder);
    sinon.assert.calledOnce(instrument);
  })

});
