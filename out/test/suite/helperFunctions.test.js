"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const helperFunctions_1 = require("../../helperFunctions");
suite("Extension Test Suite", () => {
    test("Has API key", () => {
        let apiKey;
        assert.strictEqual(false, (0, helperFunctions_1.hasApiKey)(apiKey));
        apiKey = "";
        assert.strictEqual(false, (0, helperFunctions_1.hasApiKey)(apiKey));
        apiKey = "something";
        assert.strictEqual(true, (0, helperFunctions_1.hasApiKey)(apiKey));
    });
});
//# sourceMappingURL=helperFunctions.test.js.map