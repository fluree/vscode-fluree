import * as assert from "assert";
import * as path from "path";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function submitQuery(): Promise<void> {
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
    console.log(vscode.workspace.workspaceFolders);
    const configString = JSON.stringify({
      ip: "http://localhost:9090",
      db: "test",
      network: "test",
    });

    const uri = vscode.Uri.file(
      path.join(__dirname + "/../../../src/test/fixtures/" + "query.json")
    );
    const testDocument = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(testDocument);

    vscode.commands.executeCommand("extension.setTestConfig");

    vscode.commands.executeCommand("editor.action.selectAll");
    await submitQuery();
    await sleep(1000); //let the results load

    const resultsEditor = vscode.window.activeTextEditor;
    if (resultsEditor) {
      let document = resultsEditor.document;
      const documentText = document.getText();
      const jsonMap: { _id: string; "_collection/name": string }[] =
        JSON.parse(documentText);
      const hasUserCollection = jsonMap.some(
        (e) => e["_collection/name"] === "_user"
      );
      assert.strictEqual(true, hasUserCollection);
    }
  }).timeout(5000);
});
