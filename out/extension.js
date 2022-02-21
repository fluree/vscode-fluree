"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const helperFunctions_1 = require("./helperFunctions");
async function activate(context) {
    let config;
    let root = vscode.workspace.rootPath || "";
    let setTestConfig = vscode.commands.registerCommand("extension.setTestConfig", () => {
        config = { ip: "http://localhost:8090", network: "test", db: "test" };
        console.log("Test Config Set: ", config);
    });
    let setConfig = vscode.commands.registerCommand("extension.setConfig", () => {
        vscode.workspace
            .findFiles("flureeConfig.json", null, 1)
            .then((res) => {
            if (res.length === 0) {
                let myConfig = {};
                return vscode.window
                    .showInputBox({
                    prompt: `No 'flureeConfig.json' found. Please input the IP address where your db is running. For example: http://localhost:8090: `,
                    value: "IP",
                })
                    .then((res) => {
                    if (res) {
                        myConfig["ip"] = res;
                        return vscode.window.showInputBox({
                            prompt: `Please input the network your database is in: `,
                            value: "Network",
                        });
                    }
                })
                    .then((res) => {
                    if (res) {
                        myConfig["network"] = res;
                        return vscode.window.showInputBox({
                            prompt: `Please input your database name: `,
                            value: "Database",
                        });
                    }
                })
                    .then((res) => {
                    if (res) {
                        myConfig["db"] = res;
                        return vscode.window.showInputBox({
                            prompt: `Please input your api key if using Nexus: `,
                        });
                    }
                })
                    .then((res) => {
                    if (res) {
                        myConfig["apiKey"] = res;
                        return myConfig;
                    }
                    else {
                        return myConfig;
                    }
                });
                // .catch((err) =>
                //   vscode.showErrorMessage(
                //     "There was an error in setting the configuration. ",
                //     JSON.stringify(err)
                //   )
                // );
            }
            else {
                return (0, helperFunctions_1.getConfigFile)(res);
            }
        })
            .then((res) => {
            if (typeof res !== "undefined") {
                config = res;
            }
        })
            .then((_res) => vscode.window.showInformationMessage("Config set. " +
            "Network: " +
            config.network +
            " Db: " +
            config.db +
            " IP: " +
            config.ip +
            " apiKey: " +
            (config.apiKey || "")));
        // .catch((err) =>
        //   vscode.showErrorMessage(
        //     "There was an error in setting the configuration. ",
        //     JSON.stringify(err)
        //   )
        // );
    });
    let getConfig = vscode.commands.registerCommand("extension.getConfig", () => {
        vscode.window.showInformationMessage("Config. " +
            "Network: " +
            config.network +
            " Db: " +
            config.db +
            " IP: " +
            config.ip +
            " apiKey: " +
            (config.apiKey || ""));
    });
    let submitTransaction = vscode.commands.registerCommand("extension.submitTransaction", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/transact`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers);
        }
    });
    let submitQuery = vscode.commands.registerCommand("extension.submitQuery", async () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            console.log("txn: ", txn);
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/query`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            //return sendReq(endpoint, txn, root, headers);
            (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => {
                console.log("query results: ", results);
                return vscode.workspace
                    .openTextDocument({
                    language: "json",
                    content: JSON.stringify(results, null, 2),
                })
                    .then((doc) => {
                    return vscode.window.showTextDocument(doc);
                });
            })
                .catch((err) => console.log("error: ", err));
        }
    });
    let submitHistoryQuery = vscode.commands.registerCommand("extension.submitHistoryQuery", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/history`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers);
        }
    });
    let submitBlockQuery = vscode.commands.registerCommand("extension.submitBlockQuery", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/block`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers);
        }
    });
    let submitMultiQuery = vscode.commands.registerCommand("extension.submitMultiQuery", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/multi-query`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers);
        }
    });
    let submitQueryWith = vscode.commands.registerCommand("extension.submitQueryWith", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/query-with`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers);
        }
    });
    let submitGenFlakes = vscode.commands.registerCommand("extension.submitGenFlakes", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/gen-flakes`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers);
        }
    });
    let submitTestTransactWith = vscode.commands.registerCommand("extension.submitTestTransactWith", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/test-transact-with`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers);
        }
    });
    let getMigrations = vscode.commands.registerCommand("extension.getMigrations", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            return (0, helperFunctions_1.fetchMigrations)(endpoint, root, headers);
        }
    });
    context.subscriptions.push(setTestConfig, setConfig, getConfig, submitTransaction, submitQuery, submitHistoryQuery, submitBlockQuery, submitMultiQuery, submitQueryWith, submitGenFlakes, submitTestTransactWith, getMigrations);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map