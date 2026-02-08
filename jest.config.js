module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "js"],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
};
