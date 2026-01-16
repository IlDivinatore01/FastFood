export default {
  // Specifies the test environment, 'node' is required for backend tests.
  testEnvironment: 'node',

  // A global timeout for all tests and hooks.
  testTimeout: 30000,

  // This is crucial for native ES module support.
  // It tells Jest to use Node's own module loader.
  transform: {},
};