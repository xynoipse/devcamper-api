module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/jest.setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};
