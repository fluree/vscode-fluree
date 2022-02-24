// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path = require("path");
import * as vscode from "vscode";
import {
  getConfigFile,
  getCurrentSelection,
  sendReq,
  checkExitPromise,
  fetchMigrations,
  hasApiKey,
} from "./helperFunctions";

const showResults = (results: any) => {
  return vscode.workspace
    .openTextDocument({
      language: "json",
      content: JSON.stringify(results, null, 2),
    })
    .then((doc) => {
      return vscode.window.showTextDocument(doc);
    });
};

function updateConfig(key: string, value: string) {
  const settings = vscode.workspace.getConfiguration("fluree", null);
  try {
    settings.update(key, value, vscode.ConfigurationTarget.Global);
  } catch (error) {
    console.log("update error: ", error);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  let config = vscode.workspace.getConfiguration("fluree", null);
  let root = vscode.workspace.rootPath;

  let setTestConfig = vscode.commands.registerCommand(
    "extension.setTestConfig",
    () => {
      //config = { ip: "http://localhost:8090", network: "test", db: "test" };
    }
  );

  let setNexusConfig = vscode.commands.registerCommand(
    "extension.setNexusConfig",
    () => {
      vscode.window
        .showInputBox({
          prompt: `Please input the connection string found on the Connect tab of your Nexus dataset page `,
          value: "",
        })
        .then((res) => {
          //check format of splitting url, network, db
          //"https://api.dev.flur.ee/fdb/fluree/387028092977278"
          if (res) {
            const url = new URL(res);
            const base = url.host;
            const path = url.pathname;
            const [_blank, _fdb, network, db] = path.split("/");
            updateConfig("network", network);
            updateConfig("db", db);
            updateConfig("host", `https://${base}`);
            return vscode.window.showInputBox({
              prompt:
                "Please enter the api_key you created on the Nexus dataset Connect tab",
              value: "",
            });
          }
        })
        .then((res) => {
          if (res) {
            updateConfig("apiKey", res);
          }
        })
        .then((_res) => {
          config = vscode.workspace.getConfiguration("fluree", null);
          vscode.window.showInformationMessage(
            "Config set. " +
              "Network: " +
              config.network +
              " Db: " +
              config.db +
              " Host: " +
              config.host +
              " apiKey: " +
              (config.apiKey || "")
          );
        });
    }
  );

  let setConfig = vscode.commands.registerCommand("extension.setConfig", () => {
    vscode.window
      .showInputBox({
        prompt: `Please input the host address (and port) where your db is running. For example: http://localhost:8090: `,
        value: config.host || "",
      })
      .then((res) => {
        if (res) {
          updateConfig("host", res);
          return vscode.window.showInputBox({
            prompt: `Please input the network your database is in: `,
            value: config.network || "",
          });
        }
      })
      .then((res) => {
        if (res) {
          updateConfig("network", res);
          return vscode.window.showInputBox({
            prompt: `Please input your database name: `,
            value: config.db || "",
          });
        }
      })
      .then((res) => {
        if (res) {
          updateConfig("db", res);
          return vscode.window.showInputBox({
            prompt: `Please input your api key if using Nexus: `,
            value: config.apiKey || "",
          });
        }
      })
      .then((res) => {
        if (res) {
          updateConfig("apiKey", res);
        }
      })
      .then((_res) => {
        config = vscode.workspace.getConfiguration("fluree", null);
        vscode.window.showInformationMessage(
          "Config set. " +
            "Network: " +
            config.network +
            " Db: " +
            config.db +
            " Host: " +
            config.host +
            " apiKey: " +
            (config.apiKey || "")
        );
      });
  });

  let getConfig = vscode.commands.registerCommand("extension.getConfig", () => {
    config = vscode.workspace.getConfiguration("fluree", null);
    vscode.window.showInformationMessage(
      "Config. " +
        "Network: " +
        config.network +
        " Db: " +
        config.db +
        " Host: " +
        config.host +
        " apiKey: " +
        (config.apiKey || "")
    );
  });

  let submitTransaction = vscode.commands.registerCommand(
    "extension.submitTransaction",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/transact`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let submitQuery = vscode.commands.registerCommand(
    "extension.submitQuery",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/query`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        //return sendReq(endpoint, txn, root, headers);
        sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let submitHistoryQuery = vscode.commands.registerCommand(
    "extension.submitHistoryQuery",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/history`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let submitBlockQuery = vscode.commands.registerCommand(
    "extension.submitBlockQuery",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/block`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let submitMultiQuery = vscode.commands.registerCommand(
    "extension.submitMultiQuery",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/multi-query`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let submitQueryWith = vscode.commands.registerCommand(
    "extension.submitQueryWith",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/query-with`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let submitGenFlakes = vscode.commands.registerCommand(
    "extension.submitGenFlakes",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/gen-flakes`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let submitTestTransactWith = vscode.commands.registerCommand(
    "extension.submitTestTransactWith",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let txn = getCurrentSelection() || "";
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}/test-transact-with`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return sendReq(endpoint, txn, headers)
          .then((results: any) => showResults(results))
          .catch((err: any) => console.log("error: ", err));
      }
    }
  );

  let getMigrations = vscode.commands.registerCommand(
    "extension.getMigrations",
    () => {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          "Please connect to a database first. `Fluree: Set Config`"
        );
      } else {
        let endpoint = `${config.host}/fdb/${config.network}/${config.db}`;
        let headers = {};
        if (hasApiKey(config.apiKey)) {
          headers = { authorization: `Bearer ${config.apiKey}` };
        }
        return fetchMigrations(endpoint, root || "/tmp", headers);
      }
    }
  );

  context.subscriptions.push(
    setTestConfig,
    setNexusConfig,
    setConfig,
    getConfig,
    submitTransaction,
    submitQuery,
    submitHistoryQuery,
    submitBlockQuery,
    submitMultiQuery,
    submitQueryWith,
    submitGenFlakes,
    submitTestTransactWith,
    getMigrations
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
