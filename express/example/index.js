const express = require('express');
const app = express();
const axios = require('axios').default;

const { observe, HttpTracer } = require('observable-expressjs');

observe(app, {
  tracing: {
    zipkinProjector: true,
    config: {
      serviceName: 'example-app'
    }
  }
});

app.get('/', (req, res) => {
  const headers = {};
  const httpTracer = new HttpTracer(req);
  httpTracer.startSpan('https://google.com', 'GET', headers);

  axios.get('https://google.com', { headers })
    .then(() => {
      httpTracer.finishSpan(200);
      res.sendStatus(200);
    })
});

app.listen(3000, () => console.log(`example listening on port 3000!`));
