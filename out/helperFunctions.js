"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasApiKey = exports.fetchMigrations = exports.checkExitPromise = exports.sendReq = exports.getCurrentSelection = exports.getConfigFile = void 0;
const fs = require("fs");
const vscode = require("vscode");
const fetch = require("isomorphic-fetch");
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
async function sendReq(endpoint, body, extraHeaders = {}) {
    const headers = { "content-type": "application/json", ...extraHeaders };
    const fetchOpts = {
        headers: headers,
        method: "POST",
        body: body,
    };
    return fetch(endpoint, fetchOpts)
        .then((res) => parseJSON(res))
        .then((res) => {
        return res.json;
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
//# sourceMappingURL=helperFunctions.js.map