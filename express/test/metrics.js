const Metrics = require('../src/metrics').Metrics;
const assert = require('assert');

describe('tracer', function() {
  var metrics;

  beforeEach(() => {
    metrics = new Metrics();
  });

  it('has .instrument()', () => {
    assert.equal(typeof metrics.instrument, 'function')
  });

  it('has .client()', () => {
    assert.equal(typeof metrics.client, 'function')
  });
});
