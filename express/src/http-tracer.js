function startSpan(url, method, headers) {
  if (this.childSpan) {
    throw "A span is already active. Cannot create a new one."
  }

  this.childSpan = this.baseTracer
    ? this.baseTracer.startHttpSpan(url, method, headers)
    : null;
}

function finishSpan(status) {
  if (this.baseTracer && this.childSpan) {
    this.baseTracer.finishHttpSpan(this.childSpan, status);
  }
}

function interceptAxiosClient(axiosClient) {
  if (!axiosClient) {
    throw "axiosClient parameter is required";
  }

  let _t = this;

  axiosClient.interceptors.request.use((config) => {
    try {
      _t.startSpan(config.url, config.method, config.headers);
    } catch {
      //Do not affect the service if something is going wrong
    }
    return config;
  });


  axiosClient.interceptors.response.use((response) => {
    try { _t.finishSpan(response.status); } catch {}
    return response;
  }, (error) => {
    try { _t.finishSpan(error.response.status); } catch {}
    return Promise.reject(error);
  });
}

function HttpTracer(req) {
  this.req = req;
  this.baseTracer = req ? req.tracer : null;
  this.startSpan = startSpan;
  this.finishSpan = finishSpan;
  this.interceptAxiosClient = interceptAxiosClient;
}

module.exports = {
  HttpTracer
};
