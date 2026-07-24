module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js'
  ],
  moduleFileExtensions: ['js', 'json'],
  verbose: true
};
