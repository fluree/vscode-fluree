const fs = require('fs');
const vscode = require('vscode');
const closer = require('closer');
const parseJSON = require('./fetchDBInfo').parseJSON;

function insertCtxParam(codeStr){
	const regExp = /\([a-zA-Z0-9-\+\?\<\>\=\_]+ /g;
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
		params = params ? eval(params) : [];
		params.unshift("ctx")
		const paramsFormatted = "[" + params.join(" ") + "]"

		const code = functions[i]["_fn/code"]
		const codeFormatted = insertCtxParam(code)

		if(name !== "true" && name !== "false"){
			functionString = functionString + `(defn ${name}
			${paramsFormatted}
			${codeFormatted})\n\n`
		} 
	}

	return functionString
}

function addToFnFile(functionObject, root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");
	const fileContents = fnsToClojure([functionObject]);

	const filePath = `${root}/src/${dirName}/temp_custom_functions.clj`;
	fs.access(filePath, fs.constants.W_OK, (err) => vscode.window.showErrorMessage(err))
	return fs.appendFileSync(filePath, fileContents)
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

function removePushedFunction(funLocation, clojureString){
	let clojureLines = clojureString.split("\n");

	let startLine = funLocation.start.line;
	let startCol = funLocation.start.column;

	let endLine = funLocation.end.line;
	let endCol = funLocation.end.column;

	let begSegment = clojureLines.slice(0, startLine - 1);
	begSegment.push(clojureLines[startLine].substring(0, startCol))

	let finSegment = clojureLines.slice(startLine + 1);
	finSegment.unshift(clojureLines[endLine].substring(endCol));

	return begSegment.concat(finSegment).join("\n")
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
				let funLocation = obj.declarations[0].loc.start;
				if(i === parsedBody.length - 1)

				clojureStringNew = removePushedFunction(startLocation, clojureString);
				functionObj["name"] = funName;
				let paramsArray = declarations[0].init.params;
				let params = [];
				for(let j = 0; j < paramsArray.length; j++){
					let paramObj = paramsArray[j];
					let paramName = paramObj.name;
					if(paramName !== "ctx"){
						params.push(paramName);
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

function getClojureFnFromFile(root, funName){
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
	let [parsedFun, newClojureString ] = findFunction(body, funName, clojureString);
	
	if(isEmpty(parsedFun)){
		vscode.window.showErrorMessage("There is no function by that name. Please check your temp_custom_functions.clj.")
	}

	return [parsedFun, newClojureString ];
}

function pushSmartFunctions(endpoint, functionObject){
	const headers = {'Content-Type': 'application/json'}

	const fetchOpts = { 
		headers: headers,
		method: "POST", 
		body: JSON.stringify([functionObject])
	};

	return fetch(endpoint, fetchOpts)
	.then(res => parseJSON(res))
	.then(res => res.json)
}

module.exports = {
	fnsToClojure,
	addToFnFile,
	getClojureFnFromFile,
	pushSmartFunctions
};