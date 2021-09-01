const vscode = require('vscode');
const getConfigFile = require('./helperFunctions').getConfigFile;
const getCurrentSelection = require('./helperFunctions').getCurrentSelection;
const sendReq = require('./helperFunctions').sendReq;
const checkExitPromise = require('./helperFunctions').checkExitPromise;
const smartFunctions = require('./smartFunctionList').smartFunctions;
const fetchMigrations = require('./helperFunctions').fetchMigrations;

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  // A shared state object
  let config = {};
  let root = vscode.workspace.rootPath;

  let setConfig = vscode.commands.registerCommand(
    'extension.setConfig',
    function () {
      vscode.workspace
        .findFiles('flureeConfig.json', null, 1)
        .then((res) => {
          if (res.length === 0) {
            let myConfig = {};
            return vscode.window
              .showInputBox({
                prompt: `No 'flureeConfig.json' found. Please input the IP address where your db is running. For example: http://localhost:8090: `,
                value: 'IP',
              })
              .then((res) => {
                myConfig['ip'] = res;
                return vscode.window.showInputBox({
                  prompt: `Please input the network your database is in: `,
                  value: 'Network',
                });
              })
              .then((res) => {
                myConfig['network'] = res;
                return vscode.window.showInputBox({
                  prompt: `Please input your database name: `,
                  value: 'Database',
                });
              })
              .then((res) => {
                myConfig['db'] = res;
                return myConfig;
              })
              .catch((err) =>
                vscode.showErrorMessage(
                  'There was an error in setting the configuration. ',
                  JSON.stringify(err)
                )
              );
          } else {
            return getConfigFile(res);
          }
        })
        .then((res) => (config = res))
        .then((res) =>
          vscode.window.showInformationMessage(
            'Config set. ' +
              'Network: ' +
              config.network +
              ' Db: ' +
              config.db +
              ' IP: ' +
              config.ip
          )
        )
        .catch((err) =>
          vscode.showErrorMessage(
            'There was an error in setting the configuration. ',
            JSON.stringify(err)
          )
        );
    }
  );

  let getConfig = vscode.commands.registerCommand(
    'extension.getConfig',
    function () {
      vscode.window.showInformationMessage(
        'Config. ' +
          'Network: ' +
          config.network +
          ' Db: ' +
          config.db +
          ' IP: ' +
          config.ip
      );
    }
  );

  let submitTransaction = vscode.commands.registerCommand(
    'extension.submitTransaction',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/transact`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let submitQuery = vscode.commands.registerCommand(
    'extension.submitQuery',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/query`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let submitHistoryQuery = vscode.commands.registerCommand(
    'extension.submitHistoryQuery',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/history`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let submitBlockQuery = vscode.commands.registerCommand(
    'extension.submitBlockQuery',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/block`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let submitMultiQuery = vscode.commands.registerCommand(
    'extension.submitMultiQuery',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/multi-query`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let submitQueryWith = vscode.commands.registerCommand(
    'extension.submitQueryWith',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/query-with`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let submitGenFlakes = vscode.commands.registerCommand(
    'extension.submitGenFlakes',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/gen-flakes`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let submitTestTransactWith = vscode.commands.registerCommand(
    'extension.submitTestTransactWith',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let txn = getCurrentSelection();
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}/test-transact-with`;
        return sendReq(endpoint, txn, root);
      }
    }
  );

  let smartFunctionHelp = vscode.commands.registerCommand(
    'extension.smartFunctionHelp',
    function () {
      let smartFunctionNames = Object.keys(smartFunctions);
      let selectedSmartFuncion;
      vscode.window
        .showQuickPick(smartFunctionNames, {
          placeHolder: 'Which smart function do you want to learn more about?',
        })
        .then((res) => {
          selectedSmartFuncion = smartFunctions[res];
          return vscode.window.showInputBox({
            prompt: `Documentation: ${selectedSmartFuncion['doc']}`,
            value: 'Press enter to see more',
          });
        })
        .then((res) => {
          if (checkExitPromise(res, 'smart function help.')) {
            return vscode.window.showInputBox({
              prompt: `Arguments: ${selectedSmartFuncion['arguments']}`,
              value: 'Press enter to see more',
            });
          }
        })
        .then((res) => {
          if (checkExitPromise(res, 'smart function help.')) {
            return vscode.window.showInputBox({
              prompt: `Examples: ${selectedSmartFuncion['example']}`,
              value: 'Press enter to see more',
            });
          }
        })
        .then((res) => {
          if (checkExitPromise(res, 'smart function help.')) {
            return vscode.window.showInputBox({
              prompt: `Context: ${selectedSmartFuncion['context']}`,
              value: `${
                selectedSmartFuncion['seeAlso'] ? 'Press enter to see more' : ''
              }`,
            });
          }
        })
        .then((res) => {
          if (selectedSmartFuncion['seeAlso']) {
            if (checkExitPromise(res, 'smart function help.')) {
              return vscode.window.showInputBox({
                prompt: `See Also: ${selectedSmartFuncion['seeAlso']}`,
              });
            }
          }
        })
        .catch((err) =>
          vscode.window.showErrorMessage('Error: ' + err.message)
        );
    }
  );

  let getMigrations = vscode.commands.registerCommand(
    'extension.getMigrations',
    function () {
      if (Object.keys(config).length === 0) {
        vscode.window.showErrorMessage(
          'Please connect to a database first. `Fluree: Set Config`'
        );
      } else {
        let endpoint = `${config.ip}/fdb/${config.network}/${config.db}`;
        return fetchMigrations(endpoint, root);
      }
    }
  );

  context.subscriptions.push(
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
    smartFunctionHelp,
    getMigrations
  );
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
