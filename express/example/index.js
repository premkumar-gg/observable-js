const express = require('express');
const app = express();

const observable = require('observable-expressjs');

observable.observe(app, {
  tracing: {
    config: {
      serviceName: 'example-app'
    }
  }
});

app.get('/manage/health', (req, res) => {
  res.sendStatus(204);
});

app.listen(3000, () => console.log(`example listening on port 3000!`));
