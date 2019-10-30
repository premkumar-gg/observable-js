const observable = require('../src/index');
const express = require('express');
const app = express();
const assert = require('assert');
const sinon = require('sinon');

describe('observable', function() {

  var initTracerFromEnv = sinon.fake();
  var jaegerCli = { initTracerFromEnv: initTracerFromEnv };

  describe('".observe" takes express app param', function() {
    it ('valid app works good', function() {
      observable.observe(app, {}, jaegerCli);
      assert(true);
    });

    it ('invalid app throws exception', function() {
      var app1 = { randomStuff: {} };
      assert.throws(() => { observable.observe(app1, {}, jaegerCli) }, Error);
    });
  });

});
