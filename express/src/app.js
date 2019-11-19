function isExpressObject(server) {
  if (!('get' in server && 'post' in server)) {
    return false;
  }

  return typeof server['get'] === 'function' && typeof server['post'] === 'function';
}

function setSpanMiddleware(aTracer) {
  this.server.use((req, res, next) => {
    if (req.url === "/manage/health") {
      next();
      return;
    }

    req.tracer = aTracer;

    const parentSpan = aTracer.startParentHttpSpan(req);

    const afterResponse = (theSpan) => {
      res.removeListener('finish', afterResponse);
      theSpan.finish();
    };

    res.on('finish', () => afterResponse(parentSpan));

    next()
  });
}

function App(server) {
  if ( ! isExpressObject(server)) {
    throw Error('server is not an express app');
  }

  this.server = server;
  this.setTracer = setSpanMiddleware;
}

module.exports = {
  App
};
