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

function HttpTracer(req) {
  this.req = req;
  this.baseTracer = req ? req.tracer : null;
  this.startSpan = startSpan;
  this.finishSpan = finishSpan;
}

module.exports = {
  HttpTracer
};
