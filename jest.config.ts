module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  resetMocks: true,
  maxWorkers: 1,
  modulePathIgnorePatterns: ["./dist/", "./test/mocks.ts"],
  coveragePathIgnorePatterns: ["./test/mocks.ts"],
};
