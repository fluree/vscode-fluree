// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fetch = require('isomorphic-fetch');
const fs = require('fs');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */


function parseJSON(response) {
	return response.json().then(function (json) {
	  const newResponse = Object.assign(response, { json });
  
	  if (response.status < 300) {
		return newResponse;
	  } else {
		throw newResponse;
	  }
	});
  }

function getSchema(baseEndpoint){
	const headers = {'Content-Type': 'application/json'}

	const query = {
		collections: { select: ["*"], from: "_collection" },
		predicates: { select: ["*"], from: "_predicate" },
		functions: { select: ["*"], from: "_fn" },
		auth: { select: ["*", {"_auth/roles": ["*", {"_role/rules": ["*", {"_rule/fn": ["*"]}]}]}], from: "_auth"}
	};

	const fetchOpts = { 
		headers: headers,
		method: "POST", 
		body: JSON.stringify(query)
	};

	return fetch(`${baseEndpoint}/multi-query`, fetchOpts)
}

function fnsToClojure(functions){
	let functionString = ""

	for(let i = 0; i < functions.length; i++){
		let name = functions[i]["_fn/name"];
		let params = functions[i]["_fn/params"]
		params = params ? params : "[ ]" 
		let code = functions[i]["_fn/code"]

		if(name !== "true" && name !== "false"){
			functionString = functionString + `(defn ${name}
			${params}
			${code}) \n`
		} 
	}

	return functionString
}

function createFnFile(cljFunctions, root){
	fs.appendFile(`${root}/myfunctionsfile.clj`, cljFunctions, function(err){
		console.log(err)
	})
}

function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "flureesmartfunctionhelper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let getDb = vscode.commands.registerCommand('extension.getDB', function(){
		vscode.workspace.findFiles('**/*.json', null, 1)
		.then(res => {
			let uri = res[0]["path"]
			vscode.workspace.openTextDocument(uri).then(doc => {
				let text= doc.getText();
				text = JSON.parse(text)
				let { network, db, ip } = text;
				let baseEndpoint = `${ip}/fdb/${network}/${db}`;
				return baseEndpoint
			}).then(endpoint => {
				return getSchema(endpoint)
			})
			.then(res => parseJSON(res))
			.then(res => res.json)
			.then(res => {
				let { collections, predicates, functions, auth } = res;
				// console.log(collections, predicates, functions, auth)
				let cljFunctions = fnsToClojure(functions)
				console.log(cljFunctions);
				return cljFunctions
			})
			.then(funs => {
				let root = vscode.workspace.rootPath;
				createFnFile(funs, root);
				return;
		})
	})
	});

	// let getConfig = vscode.commands.registerCommand('extension.getConfig', function(){

	// })

	context.subscriptions.push(getDb);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
