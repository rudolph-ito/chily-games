/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  maxWorkers: 1, // need to be serial since reset database between tests
  testEnvironment: "node",
  transform: {
    "^.+\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
};
