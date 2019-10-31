const observable = require('../src/index');
const express = require('express');
const app = express();
const assert = require('assert');
const sinon = require('sinon');

describe('observable', function() {

  var mockTracer = { doSomething: () => {} };
  var initTracerFromEnv = sinon.fake.returns(mockTracer);
  var jaegerCli = { initTracerFromEnv: initTracerFromEnv };

  describe('".observe" takes express app param', function() {
    it('valid app works good', function() {
      const observed = observable.observe(app, {}, jaegerCli);
      assert(!!observed.tracer);
    });

    it ('invalid app throws exception', function() {
      var app1 = { randomStuff: {} };
      assert.throws(() => { observable.observe(app1, {}, jaegerCli) }, Error);
    });
  });

  describe('".observe" can optionally', function() {
    it('disable tracing', function() {
      const observed = observable.observe(app, { tracing: false }, jaegerCli);
      assert.equal(observed.tracer, null);
    })
  })

});
