// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./jest.setup.js"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
