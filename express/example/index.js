const express = require('express');
const app = express();
const axios = require('axios').default;

const observable = require('observable-expressjs');

const observed = observable.observe(app, {
  tracing: {
    config: {
      serviceName: 'example-app'
    }
  }
});

app.get('/', (req, res) => {

  var aChildSpan = observed.tracer.getBaseTracer().startSpan("outbound_http_request", { childOf: observed.tracer.globalSpan });
  aChildSpan.log({google: 'called'});

  axios.get('https://google.com')
    .then(() => {
      aChildSpan.finish();
      res.sendStatus(200);
    })
});

app.listen(3000, () => console.log(`example listening on port 3000!`));
