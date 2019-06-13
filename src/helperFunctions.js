
const fs = require('fs');
const cp = require('child_process');
const vscode = require('vscode');
const fetch = require('isomorphic-fetch');
const closer = require('closer');

function initiateProject(root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	vscode.window.showInformationMessage("Creating new smart-function Clojure project.")
	let resp = cp.execSync(`cd ${root};cd ..;lein new smart-function ${appName} --force`)
	return resp.toString().trim();
}

function checkInitiateProject(root){
	let projectExists = fs.existsSync(`${root}/project.clj`);
	let versionExists;

	if(projectExists){
		versionExists = fs.existsSync(`${root}/.VERSION`);
	}

	if(projectExists && versionExists){
		let version = fs.readFileSync(`${root}/.VERSION`, 'utf8');
		version = version.trim();
		let latestVersion; 

		return fetch('https://clojars.org/api/artifacts/smart-function/lein-template')
		.then(res => parseJSON(res))
		.then(res => res.json)
		.then(res => latestVersion = res.latest_version.trim())
		.then(res => {
			if(version !== latestVersion){
				return vscode.window.showQuickPick(["Yes, update my Clojure project and lose any changes not on my database.", "No, do not update."], {placeHolder: `You have version ${version} of the Fluree Smart Function project. \n The latest version is ${latestVersion}. \n Would you like to update to the latest version? Note all functions not saved to the database will be lost. `})
			}
			return false
		})
		.then(res => {
			if(res === "Yes, update my Clojure project and lose any changes not on my database."){
				return true
			}
			return res
		})
		.catch(err => {
			throw new Error(err)
		})
	} 
	
	return new Promise(function(resolve, reject) {
		resolve(true)
	  })
}

function createFuncFileHeaders(dirName){
	return `(ns ${dirName}.custom_functions
		(:refer-clojure :exclude [max min get inc dec + - * / quot mod == rem contains? get-in < <= > >=
								  boolean re-find and or count str nth rand nil? hash-set empty? not])
		(:require [${dirName}.fns :refer :all]
				  [clojure.tools.logging :as log]))`}

function createFnFile(cljFunctions, root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");
	const fileContents = createFuncFileHeaders(dirName) + "\n \n" + cljFunctions;

	const filePath = `${root}/src/${dirName}/custom_functions.clj`

	return fs.writeFileSync(filePath, fileContents);
}

function writeRootAuth(rootAuth, root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");

	const filePath = `${root}/src/${dirName}/rootAuth.txt`;

	return fs.writeFileSync(filePath, rootAuth);
}

function getEndpoint(res){
	let uri = res[0]["path"]
	return vscode.workspace.openTextDocument(uri).then(doc => {
		let text= doc.getText();
		text = JSON.parse(text)
		let { network, db, ip } = text;
		return { network: network, db: db, ip: ip };
	})
	.catch(err => vscode.window.showErrorMessage(err.message))
}

function parseJSON(response) {
	return response.json().then(function (json) {
		const newResponse = Object.assign(response, { json });
  
	  if (response.status < 300) {
		return newResponse;
	  } else {
		throw newResponse.json;
	  }
	});
  }

function getSchema(baseEndpoint){
	const headers = {'Content-Type': 'application/json'}

	const query = {
		collections: { select: ["*"], from: "_collection" },
		predicates: { select: ["*"], from: "_predicate" },
		functions: { select: ["*"], from: "_fn" },
		auth: { select: ["*", {"_auth/roles": ["*", {"_role/rules": ["*", {"_rule/fn": ["*"]}]}]}], from: "_auth"},
		rootAuth: { selectOne: ["?auth"], where: [["?auth", "_auth/id", "?authId"],["?auth", "_auth/roles", "?roles"],["?roles", "_role/id", "root"]] }
	};

	const fetchOpts = { headers: headers, method: "POST", body: JSON.stringify(query)};

	return fetch(`${baseEndpoint}/multi-query`, fetchOpts)
	.then(res => parseJSON(res))
	.then(res => res.json)
	.catch(err => vscode.window.showErrorMessage(JSON.stringify(err.message)))
}

function fnParamFormat(functionObject){
	let params  = functionObject["_fn/params"];

	if(params === undefined){
		functionObject["_fn/params"] = "[ctx]"	
	} else {
		let paramStr = params.replace(/\[|\]|\"/gi, "").split(" ")
		paramStr = "[ctx " + paramStr.join(" ") + "]"
		functionObject["_fn/params"] = paramStr
	}

	return functionObject
}

function insertCtxParam(codeStr){
	const regExp = /\([a-zA-Z0-9-\+\?\<\>\=\_\*\/\.]+ /g;
	const matches = codeStr.match(regExp) || [];
	for(let i = 0, lastIndex = 0; i < matches.length; i++){
		let startIndex = codeStr.indexOf(matches[i], lastIndex);
		let matchLength = matches[i].length;
		let endIndex = startIndex + matchLength;
		lastIndex = endIndex
		codeStr = codeStr.slice(0, endIndex ) + "ctx " + codeStr.slice(endIndex)
	}


	const regExp2 = /\([a-zA-Z0-9-\+\?\<\>\=\_]+\)/g;
	const matches2 = codeStr.match(regExp2) || [];
		for(let i = 0, lastIndex2 = 0; i < matches2.length; i++){
			let startIndex = codeStr.indexOf(matches2[i], lastIndex2);
			let matchLength = matches2[i].length;
			let endIndex = startIndex + matchLength - 1;
	
			codeStr = codeStr.slice(0, endIndex) + " ctx" + codeStr.slice(endIndex)
			lastIndex2 = endIndex
		}

	return codeStr
}

function fnsToClojure(functions){
	let functionString = ""

	for(let i = functions.length - 1; i >= 0; i--){
		const name = functions[i]["_fn/name"];
		let params = functions[i]["_fn/params"]
		let doc = functions[i]["_fn/doc"];

		const code = functions[i]["_fn/code"]
		const codeFormatted = insertCtxParam(code)

		if(name !== "true" && name !== "false"){
			if(doc){
				functionString = functionString + `(defn ${name}
	\"${doc}\"
	${params}
	${codeFormatted})\n\n`} else {
		functionString = functionString + `(defn ${name}
	${params}
	${codeFormatted})\n\n`
	}}}
	return functionString
}

function createTempFuncFileHeaders(dirName){
	return `(ns ${dirName}.temp_custom_functions
		(:refer-clojure :exclude [max min get inc dec + - * / quot mod == rem contains? get-in < <= > >=
								  boolean re-find and or count str nth rand nil? hash-set empty? not])
		(:require [${dirName}.fns :refer :all]
				  [clojure.tools.logging :as log]))
				  \n \n \n`}

function tempFnFile(root, string){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");
	const fileContents = createTempFuncFileHeaders(dirName) + "\n \n" + string;

	const filePath = `${root}/src/${dirName}/temp_custom_functions.clj`

	fs.writeFileSync(filePath, fileContents);

	return filePath
}

function addToFnFile(functionObject, root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");
	const fileContents = fnsToClojure([functionObject]);

	const filePath = `${root}/src/${dirName}/temp_custom_functions.clj`;
	let fileExists = fs.existsSync(filePath);
	if(fileExists){
		fs.access(filePath, fs.constants.W_OK, (err) => vscode.window.showErrorMessage(err))
		return fs.appendFileSync(filePath, fileContents)
	} else {
		tempFnFile(root, fileContents)
	}
}

function removeExtraSpaces(string){
	return string.replace(/ +/g, " ");
}

// From https://coderwall.com/p/_g3x9q/how-to-check-if-javascript-object-is-empty
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function removePushedFunction(startLocation, endLocation, clojureString){
	let clojureLines = clojureString.split("\n");
	let totalLines = clojureLines.length

	let startLine = startLocation.line;
	let startCol = startLocation.column;

	let endLine = endLocation.line;
	let endCol = endLocation.column;

	let begSegment = clojureLines.slice(0, startLine - 1);
	begSegment.push(clojureLines[startLine].substring(0, startCol))
	let finSegment = clojureLines.slice(endLine, totalLines - 1);
	finSegment.unshift(clojureLines[endLine - 1].substring(endCol - 1));
	let res = begSegment.concat(finSegment).join("\n");
	return res;
}

// Also, should return clojure string with the pushed function removes
function findFunction(parsedBody, funName, clojureString){
	let functionObj = {};
	let clojureStringNew = clojureString;
	for(let i = 0; i < parsedBody.length; i++){
		let obj = parsedBody[i];
		if(obj.type === "VariableDeclaration"){
			let declarations = obj.declarations;
			let name = declarations[0].id.name;
			if(name === funName){
				let startLocation = obj.declarations[0].loc.start;
				let endLocation = {};
				if(i === (parsedBody.length - 1)){
					let lines = clojureString.split("\n");
					endLocation["line"] = lines.length;
					endLocation["column"] = lines[lines.length - 1].length;
				} else {
					endLocation = parsedBody[i + 1].declarations[0].loc.start;
				}

				clojureStringNew = removePushedFunction(startLocation, endLocation, clojureString);
				functionObj["name"] = funName;
				let paramsArray = declarations[0].init.params;
				let params = "";
				for(let j = 0; j < paramsArray.length; j++){
					let paramObj = paramsArray[j];
					let paramName = paramObj.name;
					if(paramName !== "ctx"){
						params = params + paramName + " "
					}
				}
				functionObj["params"] = params;

				let codeLocation = declarations[0].init.body.loc;
				let { start, end } = codeLocation;
				let clojureLines = clojureString.split("\n");
				let startLine = start.line;
				let endLine = end.line;

				let clojureSection = clojureLines.slice(startLine - 1, endLine);
				if(clojureSection.length === 1){
					let shortenedCode = clojureSection[0].substring(start.column, end.column);
					let noCtxCode = shortenedCode.replace(/ ctx/g, "");
					functionObj["code"] = noCtxCode;
				} else {
					let clojureSectionStart = clojureSection[0].substring(start.column);
					clojureSection[0] = clojureSectionStart;
					let sectionLastLine = clojureSection.length - 1;
					let clojureSectionEnd = clojureSection[sectionLastLine].substring(0, end.column);
					clojureSection[sectionLastLine] = clojureSectionEnd;
					
					let clojureCollapsed = clojureSection.join("\n");
					clojureCollapsed = removeExtraSpaces(clojureCollapsed);
					let noCtxCode = clojureCollapsed.replace(/ ctx /g, " ");
					functionObj["code"] = noCtxCode;
				}

				break;
			}
		}
	}

	return [functionObj, clojureStringNew];
}

function getParsedFnBody(root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");

	const filePath = `${root}/src/${dirName}/temp_custom_functions.clj`;
	let fileContents = fs.readFileSync(filePath);
	let clojureString = fileContents.toString();
	clojureString = removeExtraSpaces(clojureString);
	let startIndex = clojureString.indexOf("(defn ")
	clojureString = clojureString.substr(startIndex);

	let parsed = closer.parse(clojureString);
	let body = parsed.body;
	return [body, clojureString];
}

function getClojureFnFromFile(root, funName){
	const [body, clojureString] = getParsedFnBody(root);
	let [parsedFun, newClojureString ] = findFunction(body, funName, clojureString);
	
	if(isEmpty(parsedFun)){
		throw new Error("There is no function by that name. Please check your temp_custom_functions.clj.")
	}

	return [parsedFun, newClojureString ];
}

function getAllFnNamesFromFile(root){
	const [body, _] = getParsedFnBody(root);
	let fnNames = [];
	body.map(fn => {
		if(fn.type === "VariableDeclaration"){
			let name = fn.declarations[0].id.name;
			fnNames.push(name)
		}		
	})

	return fnNames
}

function sendTxn(endpoint, functionObject){
	const headers = {'Content-Type': 'application/json'}

	const fetchOpts = {  
		headers: headers,
		method: "POST", 
		body: JSON.stringify(functionObject)
	};

	return fetch(endpoint, fetchOpts)
	.then(res => parseJSON(res))
	.then(res => res.json)
}

function checkFunctionName(){
	return vscode.window.showInputBox({prompt: "What is the name of your temporary smart function?"})
	.then(res => {
			if(res === undefined){
				throw new Error("The user exited create temp function")
			} else if(res.match(/^[a-zA-Z]+[a-zA-Z0-9\-]+$/g)){
				return res
			} else {
				vscode.window.showErrorMessage("Function name must begin with a letter. Must be alphanumeric, can include -.")
				return checkFunctionName()
	}})
	.catch(err => {
		throw new Error("Error: " + err.message)
	})
}

function checkExitPromise(res, exitedFunction){
	if(res === undefined){	
		throw new Error(`The user exited ${exitedFunction}`)
	} 
	else {	
		return true	
	}
}

function checkFlureeConfigAndUpdateState(root, res){
	let state = {};

	return new Promise(function(resolve, reject) {
			resolve(res)
	})
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
		return getSchema(`${ip}/fdb/${network}/${db}`)
	})
	.then(res => {
		state["collections"] = res.collections;
		state["predicates"] = res.predicates;
		state["auth"] = res.auth;
		state["rootAuth"] = res.rootAuth[0];
		state["functions"] = res.functions.map(fn => {
			return fnParamFormat(fn)
		})
		let cljFunctions = fnsToClojure(state["functions"]);
		writeRootAuth(res.rootAuth[0], root);
		return createFnFile(cljFunctions, root)
	})
	.then(res => state)
	.catch(err => {
		throw new Error("Error: " + err.message);
	})
}

module.exports = {
	initiateProject,
	checkInitiateProject,
	createFnFile,
	writeRootAuth,
	getEndpoint,
	parseJSON,
	getSchema,
	fnParamFormat,
	fnsToClojure,
	addToFnFile,
	getClojureFnFromFile,
	getAllFnNamesFromFile,
	sendTxn,
	tempFnFile,
	removeExtraSpaces,
	checkFunctionName,
	checkFlureeConfigAndUpdateState,
	checkExitPromise
};