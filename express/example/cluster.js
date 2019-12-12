'use strict';

const cluster = require('cluster');
const express = require('express');
const observable = require('observable-expressjs');
const mainServer = express();

observable.observe(mainServer, {
  tracing: {
    zipkinProjector: true,
    config: {
      serviceName: 'example-cluster-app'
    }
  }
});

if (cluster.isMaster) {
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }

  mainServer.listen(3001);
  console.log(
    'Cluster metrics server listening to 3001, metrics exposed on /metrics'
  );
} else {
  require('./index.js');
}
