import * as assert from "assert";
import { hasApiKey } from "../../helperFunctions";

suite("Extension Test Suite", () => {
  test("Has API key", () => {
    let apiKey: any;
    assert.strictEqual(false, hasApiKey(apiKey));
    apiKey = "";
    assert.strictEqual(false, hasApiKey(apiKey));
    apiKey = "something";
    assert.strictEqual(true, hasApiKey(apiKey));
  });
});
