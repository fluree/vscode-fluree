// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const getSchema = require('./helperFunctions/fetchDBInfo').getSchema;
const getEndpoint = require('./helperFunctions/fetchDBInfo').getEndpoint;
const parseSmartFunction = require('./helperFunctions/parseSmartFunction');
const fnsToClojure = parseSmartFunction.fnsToClojure;
const checkInitiateProject = require('./helperFunctions/bootstrap').checkInitiateProject;
const createFnFile = require('./helperFunctions/bootstrap').createFnFile;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */


function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "flureesmartfunctionhelper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let getDb = vscode.commands.registerCommand('extension.getDB', function(){
		let db, network, ip;
		let root = vscode.workspace.rootPath;
		vscode.window.showInformationMessage("Initiating Smart Function Project.")
		checkInitiateProject(root)
		.then(res => vscode.workspace.findFiles('flureeconfig.json', null, 1))
		.then(res => getEndpoint(res))
		.then(res => {
			db = res.db;
			network = res.network;
			ip = res.ip;
			return getSchema(`${ip}/fdb/${network}/${db}`)
		})
		.then(res => {
			let { collections, predicates, functions, auth } = res;
			let cljFunctions = fnsToClojure(functions);
			console.log("CLJ FUNCTIONS", cljFunctions)
			return createFnFile(cljFunctions, root)
		})
		.then(res => vscode.window.showInformationMessage("Smart Function Project successfully initiated."))
		.catch(err => vscode.window.showErrorMessage("There was an error initiating the smart function project." + err))
	})

	context.subscriptions.push(getDb);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
