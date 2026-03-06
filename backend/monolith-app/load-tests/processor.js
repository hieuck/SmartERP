// Artillery processor for custom functions

module.exports = {
  // Generate random string for IDs
  randomString: function(context, events, done) {
    context.vars.randomId = Math.random().toString(36).substring(7);
    return done();
  },

  // Log response times for analysis
  logResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      console.log(`Error ${response.statusCode}: ${requestParams.url}`);
    }
    return next();
  },

  // Custom metrics
  beforeRequest: function(requestParams, context, ee, next) {
    requestParams.startTime = Date.now();
    return next();
  },

  afterResponse: function(requestParams, response, context, ee, next) {
    const duration = Date.now() - requestParams.startTime;
    if (duration > 1000) {
      console.log(`Slow request (${duration}ms): ${requestParams.url}`);
    }
    return next();
  }
};
