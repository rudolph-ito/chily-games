const esModules = [".*\\.mjs$"].join("|");

/* @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  maxWorkers: "50%",
  moduleFileExtensions: ["ts", "js", "json", "mjs"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^konva": "konva/konva",
  },
  setupFilesAfterEnv: ["./src/jest-global-custom.ts", "jest-canvas-mock"],
  transformIgnorePatterns: [`node_modules/(?!${esModules})`],
  transform: {
    "^.*\\.ts$": [
      "jest-preset-angular",
      {
        tsConfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
};

// eslint-disable-next-line no-undef
module.exports = config;
