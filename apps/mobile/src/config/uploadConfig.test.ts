import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMobileApiBaseUrl } from "./uploadConfig";

describe("resolveMobileApiBaseUrl", () => {
  it("uses the explicit environment URL when it is provided", () => {
    assert.equal(
      resolveMobileApiBaseUrl({
        envBaseUrl: "http://api.example.test/api",
        expoHostUri: "192.168.50.39:8081"
      }),
      "http://api.example.test/api"
    );
  });

  it("derives the API URL from the Expo host for physical devices", () => {
    assert.equal(
      resolveMobileApiBaseUrl({
        expoHostUri: "192.168.50.39:8081"
      }),
      "http://192.168.50.39:8000/api"
    );
  });

  it("falls back to localhost when Expo host information is unavailable", () => {
    assert.equal(resolveMobileApiBaseUrl({}), "http://localhost:8000/api");
  });
});
