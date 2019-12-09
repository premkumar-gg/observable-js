function instrument(server) {
  this.tricorder.instrument(server);
}

function getClient() {
  return this.tricorder.client;
}

function Metrics(tricorder) {
  this.tricorder = tricorder;
  this.instrument = instrument;
  this.client = getClient;
}

module.exports = {
  Metrics
};
