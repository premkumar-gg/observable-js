var theServer;

function isExpressObject(server) {
  if (!('get' in server && 'post' in server)) {
    return false;
  }

  return typeof server['get'] === 'function' && typeof server['post'] === 'function';
}

function setSpanMiddleware(aTracer) {
  theServer.use((req, res, next) => {
    if (req.url === "/manage/health") {
      next();
      return;
    }

    aTracer.startParentHttpSpan(req);

    const afterResponse = () => {
      res.removeListener('finish', afterResponse);

      aTracer.globalSpan.finish();
    };

    res.on('finish', afterResponse);

    next()
  });
}

function init(server) {
  if ( ! isExpressObject(server)) {
    throw Error('server is not an express app');
  }

  theServer = server;

  return this;
}

module.exports = {
  init,
  setTracer: setSpanMiddleware
};
