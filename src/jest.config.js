
/** @type {import('jest').Config} */
module.exports = {
  // The root directory that Jest should scan for tests
  rootDir: '.',
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src'],
  
  // Setup files that will be run before each test
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Transform files with ts-jest for TypeScript support
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts'
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Ignore patterns for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/',
    '/types/',
    '\\.d\\.ts$'
  ]
};
