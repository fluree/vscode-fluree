// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const getEndpoint = require('./helperFunctions').getEndpoint;
const getClojureFnFromFile = require('./helperFunctions').getClojureFnFromFile;
const getAllFnNamesFromFile = require('./helperFunctions').getAllFnNamesFromFile;
const addToFnFile = require('./helperFunctions').addToFnFile;
const sendTxn = require('./helperFunctions').sendTxn;
const tempFnFile = require('./helperFunctions').tempFnFile;
const checkInitiateProject = require('./helperFunctions').checkInitiateProject;
const initiateProject = require('./helperFunctions').initiateProject;
const checkFunctionName = require('./helperFunctions').checkFunctionName;
const checkFlureeConfigAndUpdateState = require('./helperFunctions').checkFlureeConfigAndUpdateState;
const checkExitPromise = require('./helperFunctions').checkExitPromise;
const smartFunctions = require('./smartFunctionList').smartFunctions;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
	// A shared state object
	let state;

	console.log('Congratulations, your extension "flureesmartfunctionhelper" is now active!');

	let activateSmartFunction = vscode.commands.registerCommand('extension.activateSmartFunction', function(){

		let root = vscode.workspace.rootPath;

		vscode.window.showInformationMessage("Initiating Smart Function Project.")
		
		checkInitiateProject(root)
		.then(res => {
			if(res){ return initiateProject(root) }
		})
		.then(res => vscode.workspace.findFiles('flureeconfig.json', null, 1))
		.then(res => checkFlureeConfigAndUpdateState(root, res))
		.then(res => state = res)
		.then(res => vscode.window.showInformationMessage("Smart Function Extension successfully activated."))
		.catch(err => {
			vscode.window.showErrorMessage("There was an error initiating the smart function project. ")
			vscode.window.showErrorMessage("Error: " + JSON.stringify(err.message))
		})
	})

	let createTempFun = vscode.commands.registerCommand('extension.createTempFun', function(){
		let functionObject = {}
		let root = vscode.workspace.rootPath;

		checkFunctionName()
		.then(res => functionObject["_fn/name"] = res)
		.then(res => vscode.window.showInputBox({prompt: "Input your function code here."}))
		.then(res => {
			if(checkExitPromise(res, "create temp function.")){
				functionObject["_fn/code"] = res;
				return;
		}})
		.then(res => vscode.window.showInputBox({prompt: "What params does your function take? Separate with a space. Press enter if none."}))
		.then(res => {
			if(checkExitPromise(res, "create temp function.")){
			let params = res ? "[ctx " + res + "]" : "[ctx]";
			functionObject["_fn/params"] = params;
			return;
		}})	
		.then(res => addToFnFile(functionObject, root))
		.then(res => vscode.window.showInformationMessage(`Successfully added the temp function ${functionObject["_fn/name"]}.`))
		.catch(err => vscode.window.showErrorMessage("Error: " + err.message))
	})

	let refreshDbFunctions = vscode.commands.registerCommand('extension.refreshDbFunctions', function(){
		let root = vscode.workspace.rootPath;
		vscode.workspace.findFiles('flureeconfig.json', null, 1)
		.then(res => checkFlureeConfigAndUpdateState(root, res))
		.then(res => state = res)
		.then(res => vscode.window.showInformationMessage("Successfully refreshed database functions."))
		.catch(err => vscode.window.showErrorMessage("There was an error refreshing database functions: " + err.message));
	})

	let pushTempFunToDb = vscode.commands.registerCommand('extension.pushTempFunToDb', function(){
		let functionObject = { "_id": "_fn" }
		let root = vscode.workspace.rootPath;
		let newTempFunctionFileContents = ""
		let funNames = getAllFnNamesFromFile(root);

		vscode.window.showQuickPick(funNames, {placeHolder: "Which function would you like to push?"})
		.then(res => {
			if(checkExitPromise(res, "pushing a temp function.")){
				return getClojureFnFromFile(root, res)
		}})
		.then(res => {
			let funcObj = res[0];
			newTempFunctionFileContents = res[1];
			functionObject["name"] = funcObj.name;
			functionObject["params"] = funcObj.params;
			functionObject["code"] = funcObj.code;
			return vscode.window.showInputBox({prompt: `Your function name is ${functionObject["name"]}. If this is correct, press enter, else edit the name.`, value: functionObject["name"]})
		})
		.then(res => {
			if(checkExitPromise(res, "pushing a temp function.")){
				let name = res.trim();
				functionObject["name"] = name;
				return;
		}})
		.then(res => vscode.window.showInputBox({prompt: `Your function params are ${functionObject["params"]}. If this is correct, press enter, else edit the (space separated) params.`, value: functionObject["params"]}))
		.then(res => {
			if(checkExitPromise(res, "pushing a temp function.")){
				let params = res.trim()
				functionObject["params"] = params.split(" ")
				return;
		}})
		.then(res => vscode.window.showInputBox({prompt: `Your function code is ${functionObject["code"]}. If this is correct, press enter, else edit the code. (The ctx variable should not appear in the code. It is automatically injected based on the context.)`, value: functionObject["code"]}))
		.then(res => {
			if(checkExitPromise(res, "pushing a temp function.")){
				let code = res.trim();
				functionObject["code"] = code;
				return;
		}})
		.then(res => vscode.workspace.findFiles('flureeconfig.json', null, 1))
		.then(res => {
			if(res.length === 0){
				throw new Error("A flureeconfig.json file is required to initiate smart function test space.");
			} else {
				return getEndpoint(res)
		}})
		.then(res => {
			db = res.db;
			network = res.network;
			ip = res.ip;
			return (`${ip}/fdb/${network}/${db}/transact`)
		})
		.then(res => sendTxn(res, [functionObject]))
		.then(res => vscode.commands.executeCommand('extension.refreshDbFunctions'))
		.then(res => tempFnFile(root, newTempFunctionFileContents))
		.then(res => vscode.window.showInformationMessage("Successfully updated temp_custom_functions file."))
		.catch(err => vscode.window.showErrorMessage("Error: " + err.message))
	})

	let addDbFnToSpec = vscode.commands.registerCommand('extension.addDbFnToSpec', function(){
		let tx = { };
		let specType;
		let predOrColl;
		let root = vscode.workspace.rootPath;
		vscode.workspace.findFiles('flureeconfig.json', null, 1)
		.then(res => checkFlureeConfigAndUpdateState(root, res))
		.then(res => state = res)
		.then(res => vscode.window.showQuickPick(["_collection/spec", "_predicate/txSpec", "_predicate/spec"], {placeHolder: "What type of spec would you like to specify?"}))
		.then(res => {
			if(checkExitPromise(res, "add database function to spec.")){
				specType = res;
				if(specType === "_collection/spec"){
					let collections = state["collections"];
					let collectionQuickPickItems = [];
					collections.map(coll => {
						collectionQuickPickItems.push(coll["_collection/name"]);
					});
					return vscode.window.showQuickPick(collectionQuickPickItems, {placeHolder: "Which collection would you like to add to this spec?"})
				} else {
					let predicates = state["predicates"];
					let predicateQuickPickItems = [];
					predicates.map(coll => {
						predicateQuickPickItems.push(coll["_predicate/name"]);
					});
					return vscode.window.showQuickPick(predicateQuickPickItems, {placeHolder: "Which predicate do you want to add this spec to?"})
				}
		}})
		.then(res => {
			if(checkExitPromise(res, "add database function to spec.")){
				predOrColl = res;
				let functions = state["functions"];
				let functionQuickPickItems = [];
				functions.map(fn => functionQuickPickItems.push(fn["_fn/name"]));
				return vscode.window.showQuickPick(functionQuickPickItems, { placeHolder: "Which function would you like to add to this spec?" })
		}})
		.then(res => {
			if(checkExitPromise(res, "add database function to spec.")){
				if(specType === "_collection/spec"){
					tx["_id"] = ["_collection/name", predOrColl];
					tx["spec"] = [["_fn/name", res]]
				} else if(specType === "_predicate/spec"){
					tx["_id"] = ["_predicate/name", predOrColl];
					tx["spec"] = [["_fn/name", res]]
				} else if(specType === "_predicate/txSpec"){
					tx["_id"] = ["_predicate/name", predOrColl];
					tx["txSpec"] = [["_fn/name", res]]
				}
		}})
		.then(res => vscode.workspace.findFiles('flureeconfig.json', null, 1))
		.then(res => {
			if(res.length === 0){
				throw new Error("A flureeconfig.json file is required to initiate smart function test space.");
			} else {
				return getEndpoint(res)
		}})
		.then(res => {
			db = res.db;
			network = res.network;
			ip = res.ip;
			return (`${ip}/fdb/${network}/${db}/transact`)
		})
		.then(res => sendTxn(res, [tx]))
		.then(res => vscode.window.showInformationMessage("Function successfully added to spec."))
		.catch(err => vscode.window.showErrorMessage("Error: " + err.message))
	})

	let editPushDbFun = vscode.commands.registerCommand('extension.editPushDbFun', function(){
		let chosenFunction;
		let functionUpdates = {};
		let functionQuickPickItems = [];
		let functions = state["functions"];
		functions.map(fn => {
			let fnObj = {};
			fnObj["label"] = fn["_fn/name"];
			fnObj["detail"] = JSON.stringify(fn)
			fnObj["description"] = fn["_fn/code"];
			functionQuickPickItems.push(fnObj);
		});
		vscode.window.showQuickPick(functionQuickPickItems, {placeHolder: "Which function would you like to update?"})
		.then(res => {
			if(checkExitPromise(res, "push temp function to database.")){
				chosenFunction = JSON.parse(res.detail);
				functionUpdates["_id"] = chosenFunction["_id"];
				return vscode.window.showInputBox({prompt: `Your function name is ${chosenFunction["_fn/name"]}. If this is correct, press enter, else edit name.`, value: chosenFunction["_fn/name"]})
		}})
		.then(res => {
			if(checkExitPromise(res, "push temp function to database.")){
				if(chosenFunction["_fn/name"] !== res){
					functionUpdates["name"] = res
				};
				return vscode.window.showInputBox({prompt: `Your function code is ${chosenFunction["_fn/code"]}. If this is correct, press enter, else edit the code.`, value: chosenFunction["_fn/code"]})
		}})
		.then(res => {
			if(checkExitPromise(res, "push temp function to database.")){
				if(chosenFunction["_fn/code"] !== res){
					functionUpdates["code"] = res
				};
				let baseParams = chosenFunction["_fn/params"];
				baseParams = baseParams.substr(1, baseParams.length - 2)
				baseParams = baseParams.split(" ")
				
				let params = baseParams.slice(1);
				let paramStr = params.join(" ")

				return vscode.window.showInputBox({prompt: `Your function params are ${paramStr}. If this is correct, press enter, else edit the (space separated) params.`, value: paramStr})
		}})
		.then(res => {
			if(checkExitPromise(res, "push temp function to database.")){
				if(chosenFunction["_fn/params"] !== "[ctx ".concat(res, "]")){
					functionUpdates["params"] = res.split(" ")
				};
				let doc = chosenFunction["_fn/doc"];
				if(doc === undefined){
					return vscode.window.showInputBox({prompt: `You do not have a function doc. To add a doc, type it here, else press enter`, value: ""})
				} else {
					return vscode.window.showInputBox({prompt: `Your function doc is ${chosenFunction["_fn/doc"]}. If this is correct, press enter, else edit the doc.`, value: chosenFunction["_fn/doc"]})
				}
		}})
		.then(res => {
			if(checkExitPromise(res, "push temp function to database.")){
				if(chosenFunction["_fn/doc"] !== res){
					functionUpdates["doc"] = res
				};
		}})
		.then(res => {
			if(Object.keys(functionUpdates).length === 1){
				throw new Error('No changes to the function were specified.')
			} 
			return vscode.workspace.findFiles('flureeconfig.json', null, 1)
		})
		.then(res => getEndpoint(res))
		.then(res => {
			db = res.db;
			network = res.network;
			ip = res.ip;
			return (`${ip}/fdb/${network}/${db}/transact`)
		})
		.then(res => sendTxn(res, [functionUpdates]))
		.then(res => vscode.window.showInformationMessage("Database successfully updated."))
		.then(res => vscode.commands.executeCommand('extension.refreshDbFunctions'))
		.catch(err => vscode.window.showErrorMessage(err.message))
	})

	let updateSchema = vscode.commands.registerCommand('extension.updateSchema', function(){
		let root = vscode.workspace.rootPath;

		vscode.workspace.findFiles('flureeconfig.json', null, 1)
		.then(res => checkFlureeConfigAndUpdateState(root, res))
		.then(res => state = res)
		.then(res => vscode.window.showInformationMessage("Schema successfully updated."))
		.catch(err => vscode.window.showErrorMessage("Error: " + err.message))
	})

	let smartFunctionHelp = vscode.commands.registerCommand('extension.smartFunctionHelp', function(){
		let smartFunctionNames = Object.keys(smartFunctions);
		let selectedSmartFuncion; 
		vscode.window.showQuickPick(smartFunctionNames, {placeHolder: "Which smart function do you want to learn more about?"})
		.then(res => {
			selectedSmartFuncion = smartFunctions[res];
			return vscode.window.showInputBox({prompt: `Documentation: ${selectedSmartFuncion["doc"]}`, value: "Press enter to see more"});
		})
		.then(res => {
			if(checkExitPromise(res, "smart function help.")){
				return vscode.window.showInputBox({prompt: `Arguments: ${selectedSmartFuncion["arguments"]}`, value: "Press enter to see more"})
		}})
		.then(res => {
			if(checkExitPromise(res, "smart function help.")){
				return vscode.window.showInputBox({prompt: `Examples: ${selectedSmartFuncion["example"]}`, value: "Press enter to see more" })
		}})
		.then(res => {
			if(checkExitPromise(res, "smart function help.")){
				return vscode.window.showInputBox({prompt: `Context: ${selectedSmartFuncion["context"]}`, value: `${selectedSmartFuncion["seeAlso"] ? "Press enter to see more" : ""}`})
		}})
		.then(res => {
				if(selectedSmartFuncion["seeAlso"]){
					if(checkExitPromise(res, "smart function help.")){
						return vscode.window.showInputBox({prompt: `See Also: ${selectedSmartFuncion["seeAlso"]}`})
					}
				}
		})
		.catch(err => vscode.window.showErrorMessage("Error: " + err.message))
	})

	context.subscriptions.push(activateSmartFunction, createTempFun, pushTempFunToDb, 
		refreshDbFunctions, addDbFnToSpec, editPushDbFun, updateSchema, smartFunctionHelp );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
