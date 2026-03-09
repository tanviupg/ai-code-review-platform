const test = require("node:test");
const assert = require("node:assert/strict");
const { validateEnvironment, getRuntimeConfig } = require("../config/env");

const withEnv = (updates, fn) => {
  const snapshot = {};
  for (const key of Object.keys(updates)) {
    snapshot[key] = process.env[key];
    process.env[key] = updates[key];
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(updates)) {
      if (typeof snapshot[key] === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    }
  }
};

test("validateEnvironment requires MONGO_URI and JWT_SECRET", () => {
  withEnv(
    {
      NODE_ENV: "development",
      MONGO_URI: "",
      JWT_SECRET: "",
      FRONTEND_ORIGIN: "",
    },
    () => {
      assert.throws(() => validateEnvironment(), /MONGO_URI, JWT_SECRET/);
    }
  );
});

test("validateEnvironment requires FRONTEND_ORIGIN in production", () => {
  withEnv(
    {
      NODE_ENV: "production",
      MONGO_URI: "mongodb://example.com/db",
      JWT_SECRET: "secret",
      FRONTEND_ORIGIN: "",
    },
    () => {
      assert.throws(() => validateEnvironment(), /FRONTEND_ORIGIN/);
    }
  );
});

test("getRuntimeConfig parses booleans and integers safely", () => {
  withEnv(
    {
      NODE_ENV: "production",
      PORT: "5100",
      RATE_LIMIT_MAX_REQUESTS: "123",
      ENABLE_REQUEST_LOGGING: "false",
    },
    () => {
      const config = getRuntimeConfig();
      assert.equal(config.port, 5100);
      assert.equal(config.rateLimitMaxRequests, 123);
      assert.equal(config.enableRequestLogging, false);
      assert.equal(config.isProduction, true);
    }
  );
});
