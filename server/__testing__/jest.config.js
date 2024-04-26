module.exports = {
    testEnvironment: 'node',
    // Ensure no transform is applied to node_modules
    transformIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js']  // Adjust to include TS if needed
};
