import * as fs from "fs";
import * as vscode from "vscode";
const fetch = require("isomorphic-fetch");

type ConfigType = {
  ip?: string;
  apiKey?: string;
  db?: string;
  network?: string;
};

function writeToFile(filePath: string, txt: string) {
  let body = typeof txt === "string" ? txt : JSON.stringify(txt, null, 2);
  return fs.writeFileSync(filePath, body);
}

function hasApiKey(apiKey: string | undefined) {
  if (typeof apiKey === "undefined" || apiKey.length === 0) {
    return false;
  } else {
    return true;
  }
}

function getConfigFile(res: any): ConfigType {
  let uri = res[0]["path"];
  let network, db, ip, apiKey, _other: string;
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

function getCurrentSelection() {
  // From https://stackoverflow.com/questions/44175461/get-selected-text-into-a-variable-vscode
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    return text;
  }
}

function parseJSON(response: any) {
  return response
    .json()
    .then(function (json: any) {
      const newResponse = Object.assign(response, { json });
      return newResponse;
    })
    .catch((err: any) => {
      let error = err.message || err;
      vscode.window.showErrorMessage(JSON.stringify(error));
    });
}

async function sendReq(
  endpoint: string,
  body: string,
  root: string,
  extraHeaders = {}
) {
  const headers = { "content-type": "application/json", ...extraHeaders };

  const fetchOpts = {
    headers: headers,
    method: "POST",
    body: body,
  };
  console.log("fetching: ", `${endpoint}: ${JSON.stringify(fetchOpts)}`);
  return fetch(endpoint, fetchOpts)
    .then((res: any) => parseJSON(res))
    .then((res: any) => {
      console.log("response in fetch: ", res.json);
      return res.json;
    })
    .then((res: any) => {
      const filePath = `${root}/flureeResponse.txt`;
      //writeToFile(filePath, res);
      return res;
    })
    .then((res: any) => {
      let status = res.status;
      console.log(status);
      if (res.error === "db/invalid-action") {
        return vscode.window.showInformationMessage(
          ` Are you using a version of Fluree that supports this endpoint? ${
            status ? `Status: ${status}` : ""
          }. Check flureeResponse.txt`
        );
      } else {
        // return vscode.window.showInformationMessage(
        //   `Submitted. ${
        //     status ? `Status: ${status}` : ""
        //   } Check flureeResponse.txt`
        // );
        return res;
      }
    })
    .catch((err: any) => {
      let error = err.message || err;
      console.log("error: ", err);
      vscode.window.showErrorMessage(JSON.stringify(error));
    });
  console.log("here");
}

function checkExitPromise(res: any, exitedFunction: any) {
  if (res === undefined) {
    throw new Error(`The user exited ${exitedFunction}`);
  } else {
    return true;
  }
}

function historyFetch(baseURL: string, _id: any) {
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
    .then((res: any) => res.json())
    .catch((err: any) => {
      throw err;
    });
}

function fetchSchemaSubjects(baseURL: string, extraHeaders = {}) {
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
    .then((res: any) => parseJSON(res))
    .then((res: any) => res.json);
}

async function fetchHistory(res: any, baseURL: string) {
  if (res.error) {
    throw new Error(res.message || res.error);
  }
  const historyMap = res.map((el: any) => () => historyFetch(baseURL, el));
  let index = 0;
  const results = [];
  while (historyMap.length > index) {
    const newResults = await Promise.all(
      historyMap.slice(index, index + 20).map((fn: any) => fn())
    );
    results.push(...newResults.flat());
    index += 20;
  }
  return results;
}

function reduceHistory(res: any) {
  let subjectMap: { [key: number]: any; [name: string]: any };
  const sortedRes = res
    .filter((el: any) => el.block > 1 && el.asserted[0])
    .sort((a: any, b: any) => a.block - b.block);
  return sortedRes.reduce((prev: any, cur: any) => {
    const asserted = cur.asserted.map(
      (_tx: { _id: any; [name: string]: any }) => {
        if (!subjectMap[_tx._id]) {
          subjectMap[_tx._id] = Object.keys(_tx).some((el) =>
            /^_collection/.test(el)
          )
            ? ["_collection/name", _tx["_collection/name"]]
            : ["_predicate/name", _tx["_predicate/name"]];
          _tx._id = Object.keys(_tx).some((el) => /^_collection/.test(el))
            ? "_collection"
            : "_predicate";
        } else {
          _tx._id = subjectMap[_tx._id];
        }
        return _tx;
      }
    );
    if (prev[cur.block]) {
      prev[cur.block] = [...prev[cur.block], ...asserted];
    } else {
      prev[cur.block] = asserted;
    }
    return prev;
  }, {});
}

function writeDirectory(blockIndex: any, root: string) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(`${root}/migrations`, { recursive: true });
    resolve(blockIndex);
  });
}

function writeMigrations(blockIndex: any, root: string) {
  const blockNos = Object.keys(blockIndex);
  blockNos.forEach(async (block, index) => {
    await fs.writeFile(
      `${root}/migrations/${String(index).padStart(5, "0")}.json`,
      JSON.stringify(blockIndex[block]),
      (err) => {
        if (err) {
          throw err;
        }
      }
    );
  });
  return vscode.window.showInformationMessage(
    `Success. Check migrations/ in your root directory`
  );
}

function fetchMigrations(baseURL: string, root: string, options = {}) {
  return fetchSchemaSubjects(baseURL, options)
    .then((res: any) => fetchHistory(res, baseURL))
    .then(reduceHistory)
    .then((blockIndex: any) => writeDirectory(blockIndex, root))
    .then((blockIndex: any) => writeMigrations(blockIndex, root))
    .catch((err: any) => {
      let error = err.message || err;
      return vscode.window.showErrorMessage(JSON.stringify(error));
    });
}

export {
  getConfigFile,
  getCurrentSelection,
  sendReq,
  checkExitPromise,
  fetchMigrations,
  hasApiKey,
};
