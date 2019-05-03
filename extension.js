// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const getSchema = require('./helperFunctions/fetchDBInfo').getSchema;
const getEndpoint = require('./helperFunctions/fetchDBInfo').getEndpoint;
const fnsToClojure = require('./helperFunctions/parseSmartFunction').fnsToClojure;
const insertCtxParam = require('./helperFunctions/parseSmartFunction').insertCtxParam;
const addToFnFile = require('./helperFunctions/parseSmartFunction').addToFnFile;
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
	let initSmartFunction = vscode.commands.registerCommand('extension.initSmartFunction', function(){
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
			return createFnFile(cljFunctions, root)
		})
		.then(res => vscode.window.showInformationMessage("Smart Function Project successfully initiated."))
		.catch(err => vscode.window.showErrorMessage("There was an error initiating the smart function project. " + err))
	})

	let addFunction = vscode.commands.registerCommand('extension.addSmartFunction', function(){
		let functionObject = {}
		let root = vscode.workspace.rootPath;

		vscode.window.showInputBox({prompt: "What is the name of your smart function?"})
		.then(res => functionObject["_fn/name"] = res)
		.then(res => vscode.window.showInputBox({prompt: "Input your function code here."}))
		.then(res => functionObject["_fn/code"] = res)
		.then(res => vscode.window.showInputBox({prompt: "What params does your function take? Press enter if none."}))
		.then(res => {
			let params = res ? "[" + res + "]" : "[ ]"
			functionObject["_fn/params"] = params
			return;
		})
		.then(res => addToFnFile(functionObject, root))
		.catch(err => vscode.window.showErrorMessage(err))
	})

	let pushFnToDb = vscode.commands.registerCommand('extension.pushFnToDb', function(){
		let functionObject = {}
		let root = vscode.workspace.rootPath;

		vscode.window.showInputBox({prompt: "What is the name of function you would like to push?"})
		.then(res => console.log(res))
	})

	let refreshCustomFunctions = vscode.commands.registerCommand('extension.refreshCustomFunctions', function(){
		let root = vscode.workspace.rootPath;
		vscode.workspace.findFiles('flureeconfig.json', null, 1)
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
			return createFnFile(cljFunctions, root)
		})
		.then(res => console.log(res))
		.catch(err => vscode.window.showErrorMessage("There was an error refreshing the custom functions: " + err))
	})

	context.subscriptions.push(initSmartFunction, addFunction, pushFnToDb, refreshCustomFunctions);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
