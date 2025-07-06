module.exports = {
  // Simulate Node.js environment
  testEnvironment: 'node',
  testEnvironmentOptions: {},
  // Output coverage
  coverageDirectory: 'coverage',
  // Collect coverage info from:
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/*.js'
  ],
  // Global coverage thresholds per requirements
  // Fail tests if not met
  coverageThreshold: {
    global: {
      branches: 81,
      functions: 81,
      lines: 81,
      statements: 81
    }
  }


};