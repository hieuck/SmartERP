module.exports = {
  // Generate random string
  $randomString: function() {
    return Math.random().toString(36).substring(7);
  },

  // Generate random number
  $randomNumber: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Setup test data
  beforeScenario: function(userContext, events, done) {
    // Set test user credentials
    userContext.vars.testUser = {
      email: 'loadtest@example.com',
      password: 'password123'
    };

    // Set test product
    userContext.vars.testProduct = {
      id: 'test-product-id'
    };

    return done();
  },

  // Log response times
  afterResponse: function(requestParams, response, userContext, events, done) {
    if (response.statusCode >= 400) {
      console.log(`Error: ${response.statusCode} - ${requestParams.url}`);
    }
    return done();
  }
};
