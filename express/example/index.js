const express = require('express');
const app = express();
const axios = require('axios').default;

const observable = require('observable-expressjs');

const observed = observable.observe(app, {
  tracing: {
    zipkinProjector: true,
    config: {
      serviceName: 'example-app'
    }
  }
});

app.get('/', (req, res) => {
  const headers = {};
  var aChildSpan = req.tracer.startHttpSpan('https://google.com', 'GET', headers);
  aChildSpan.log({google: 'called'});

  console.log(headers);

  axios.get('https://google.com', { headers })
    .then(() => {
      aChildSpan.finish();
      res.sendStatus(200);
    })
});

app.listen(3000, () => console.log(`example listening on port 3000!`));
