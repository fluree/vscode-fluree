"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require("vscode");
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
async function submitQuery() {
    return new Promise((resolve) => {
        vscode.commands.executeCommand("extension.submitQuery");
        resolve();
    });
}
//const config = { ip: "http://localhost:8090", network: "test", db: "test" };
suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");
    test("Make a query", async () => {
        //NOTE: Requires a ledger running on localhost:8090 with a `test/test` ledger
        const fluree = vscode.workspace.getConfiguration();
        const uri = vscode.Uri.file(path.join(__dirname + "/../../../src/test/fixtures/" + "query.json"));
        const testDocument = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(testDocument);
        vscode.commands.executeCommand("extension.setTestConfig");
        vscode.commands.executeCommand("editor.action.selectAll");
        await submitQuery();
        await sleep(1000);
        const resultsEditor = vscode.window.activeTextEditor;
        if (resultsEditor) {
            let document = resultsEditor.document;
            // Get the document text
            const documentText = document.getText();
            const jsonMap = JSON.parse(documentText);
            const hasUserCollection = jsonMap.some((e) => e["_collection/name"] === "_user");
            assert.strictEqual(true, hasUserCollection);
            // DO SOMETHING WITH `documentText`
        }
        //   // vscode.workspace
        //   //   .openTextDocument("Untitled-1")
        //   //   .then((doc) => vscode.window.showTextDocument(doc));
        //   console.log("in here");
        // });
        //console.log("here");
        //});
    }).timeout(5000);
});
//# sourceMappingURL=extension.test.js.map