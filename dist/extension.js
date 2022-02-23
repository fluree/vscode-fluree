/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hasApiKey = exports.fetchMigrations = exports.checkExitPromise = exports.sendReq = exports.getCurrentSelection = exports.getConfigFile = void 0;
const fs = __webpack_require__(3);
const vscode = __webpack_require__(1);
const fetch = __webpack_require__(4);
function writeToFile(filePath, txt) {
    let body = typeof txt === "string" ? txt : JSON.stringify(txt, null, 2);
    return fs.writeFileSync(filePath, body);
}
function hasApiKey(apiKey) {
    if (typeof apiKey === "undefined" || apiKey.length === 0) {
        return false;
    }
    else {
        return true;
    }
}
exports.hasApiKey = hasApiKey;
function getConfigFile(res) {
    let uri = res[0]["path"];
    let network, db, ip, apiKey, _other;
    vscode.workspace.openTextDocument(uri).then((doc) => {
        const json = doc.getText();
        const text = JSON.parse(json);
        const { network, db, ip, apiKey } = text;
    });
    return {
        network: network || "",
        db: db || "",
        ip: ip || "",
        apiKey: apiKey || "",
    };
    //.catch((err) => vscode.window.showErrorMessage(err.message));
}
exports.getConfigFile = getConfigFile;
function getCurrentSelection() {
    // From https://stackoverflow.com/questions/44175461/get-selected-text-into-a-variable-vscode
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        return text;
    }
}
exports.getCurrentSelection = getCurrentSelection;
function parseJSON(response) {
    return response
        .json()
        .then(function (json) {
        const newResponse = Object.assign(response, { json });
        return newResponse;
    })
        .catch((err) => {
        let error = err.message || err;
        vscode.window.showErrorMessage(JSON.stringify(error));
    });
}
async function sendReq(endpoint, body, root, extraHeaders = {}) {
    const headers = { "content-type": "application/json", ...extraHeaders };
    const fetchOpts = {
        headers: headers,
        method: "POST",
        body: body,
    };
    console.log("fetching: ", `${endpoint}: ${JSON.stringify(fetchOpts)}`);
    return fetch(endpoint, fetchOpts)
        .then((res) => parseJSON(res))
        .then((res) => {
        console.log("response in fetch: ", res.json);
        return res.json;
    })
        .then((res) => {
        const filePath = `${root}/flureeResponse.txt`;
        //writeToFile(filePath, res);
        return res;
    })
        .then((res) => {
        let status = res.status;
        console.log(status);
        if (res.error === "db/invalid-action") {
            return vscode.window.showInformationMessage(` Are you using a version of Fluree that supports this endpoint? ${status ? `Status: ${status}` : ""}. Check flureeResponse.txt`);
        }
        else {
            // return vscode.window.showInformationMessage(
            //   `Submitted. ${
            //     status ? `Status: ${status}` : ""
            //   } Check flureeResponse.txt`
            // );
            return res;
        }
    })
        .catch((err) => {
        let error = err.message || err;
        console.log("error: ", err);
        vscode.window.showErrorMessage(JSON.stringify(error));
    });
    console.log("here");
}
exports.sendReq = sendReq;
function checkExitPromise(res, exitedFunction) {
    if (res === undefined) {
        throw new Error(`The user exited ${exitedFunction}`);
    }
    else {
        return true;
    }
}
exports.checkExitPromise = checkExitPromise;
function historyFetch(baseURL, _id) {
    return fetch(`${baseURL}/history`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            history: _id,
            prettyPrint: true,
        }),
    })
        .then((res) => res.json())
        .catch((err) => {
        throw err;
    });
}
function fetchSchemaSubjects(baseURL, extraHeaders = {}) {
    return fetch(`${baseURL}/query`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...extraHeaders,
        },
        body: JSON.stringify({
            selectDistinct: "?s",
            where: [
                {
                    union: [
                        [["?s", "rdf:type", "_collection"]],
                        [["?s", "rdf:type", "_predicate"]],
                    ],
                },
            ],
            opts: {
                limit: 9999,
            },
        }),
    })
        .then((res) => parseJSON(res))
        .then((res) => res.json);
}
async function fetchHistory(res, baseURL) {
    if (res.error) {
        throw new Error(res.message || res.error);
    }
    const historyMap = res.map((el) => () => historyFetch(baseURL, el));
    let index = 0;
    const results = [];
    while (historyMap.length > index) {
        const newResults = await Promise.all(historyMap.slice(index, index + 20).map((fn) => fn()));
        results.push(...newResults.flat());
        index += 20;
    }
    return results;
}
function reduceHistory(res) {
    let subjectMap;
    const sortedRes = res
        .filter((el) => el.block > 1 && el.asserted[0])
        .sort((a, b) => a.block - b.block);
    return sortedRes.reduce((prev, cur) => {
        const asserted = cur.asserted.map((_tx) => {
            if (!subjectMap[_tx._id]) {
                subjectMap[_tx._id] = Object.keys(_tx).some((el) => /^_collection/.test(el))
                    ? ["_collection/name", _tx["_collection/name"]]
                    : ["_predicate/name", _tx["_predicate/name"]];
                _tx._id = Object.keys(_tx).some((el) => /^_collection/.test(el))
                    ? "_collection"
                    : "_predicate";
            }
            else {
                _tx._id = subjectMap[_tx._id];
            }
            return _tx;
        });
        if (prev[cur.block]) {
            prev[cur.block] = [...prev[cur.block], ...asserted];
        }
        else {
            prev[cur.block] = asserted;
        }
        return prev;
    }, {});
}
function writeDirectory(blockIndex, root) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(`${root}/migrations`, { recursive: true });
        resolve(blockIndex);
    });
}
function writeMigrations(blockIndex, root) {
    const blockNos = Object.keys(blockIndex);
    blockNos.forEach(async (block, index) => {
        await fs.writeFile(`${root}/migrations/${String(index).padStart(5, "0")}.json`, JSON.stringify(blockIndex[block]), (err) => {
            if (err) {
                throw err;
            }
        });
    });
    return vscode.window.showInformationMessage(`Success. Check migrations/ in your root directory`);
}
function fetchMigrations(baseURL, root, options = {}) {
    return fetchSchemaSubjects(baseURL, options)
        .then((res) => fetchHistory(res, baseURL))
        .then(reduceHistory)
        .then((blockIndex) => writeDirectory(blockIndex, root))
        .then((blockIndex) => writeMigrations(blockIndex, root))
        .catch((err) => {
        let error = err.message || err;
        return vscode.window.showErrorMessage(JSON.stringify(error));
    });
}
exports.fetchMigrations = fetchMigrations;


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 4 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var realFetch = __webpack_require__(5);
module.exports = function(url, options) {
	if (/^\/\//.test(url)) {
		url = 'https:' + url;
	}
	return realFetch.call(this, url, options);
};

if (!global.fetch) {
	global.fetch = module.exports;
	global.Response = realFetch.Response;
	global.Headers = realFetch.Headers;
	global.Request = realFetch.Request;
}


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("node-fetch");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const helperFunctions_1 = __webpack_require__(2);
const showResults = (results) => {
    return vscode.workspace
        .openTextDocument({
        language: "json",
        content: JSON.stringify(results, null, 2),
    })
        .then((doc) => {
        return vscode.window.showTextDocument(doc);
    });
};
async function activate(context) {
    let config = {};
    let root = vscode.workspace.rootPath || "";
    let setTestConfig = vscode.commands.registerCommand("extension.setTestConfig", () => {
        config = { ip: "http://localhost:8090", network: "test", db: "test" };
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
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
                .catch((err) => console.log("error: ", err));
        }
    });
    let submitQuery = vscode.commands.registerCommand("extension.submitQuery", () => {
        if (Object.keys(config).length === 0) {
            vscode.window.showErrorMessage("Please connect to a database first. `Fluree: Set Config`");
        }
        else {
            let txn = (0, helperFunctions_1.getCurrentSelection)() || "";
            let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/query`;
            let headers = {};
            if ((0, helperFunctions_1.hasApiKey)(config.apiKey)) {
                headers = { authorization: `Bearer ${config.apiKey}` };
            }
            //return sendReq(endpoint, txn, root, headers);
            (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
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
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
                .catch((err) => console.log("error: ", err));
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
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
                .catch((err) => console.log("error: ", err));
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
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
                .catch((err) => console.log("error: ", err));
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
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
                .catch((err) => console.log("error: ", err));
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
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
                .catch((err) => console.log("error: ", err));
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
            return (0, helperFunctions_1.sendReq)(endpoint, txn, root, headers)
                .then((results) => showResults(results))
                .catch((err) => console.log("error: ", err));
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

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map