const fs = require('fs');
const vscode = require('vscode');

function insertCtxParam(codeStr){
	const regExp = /\([a-zA-Z-\?\<\>\=\_]+ /g;
	const matches = codeStr.match(regExp) || [];
	for(let i = 0, lastIndex = 0; i < matches.length; i++){
		let startIndex = codeStr.indexOf(matches[i], lastIndex);
		let matchLength = matches[i].length;
		let endIndex = startIndex + matchLength;
		lastIndex = endIndex
		codeStr = codeStr.slice(0, endIndex ) + "ctx " + codeStr.slice(endIndex)
	}

	const regExp2 = /\([a-zA-Z-\?\<\>\=\_]+\)/g;
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
			${codeFormatted}) \n \n`
		} 
	}

	return functionString
}

function addToFnFile(functionObject, root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");
	const fileContents = fnsToClojure([functionObject]);

	const filePath = `${root}/src/${dirName}/custom_functions.clj`;
	fs.access(filePath, fs.constants.W_OK, (err) => vscode.window.showErrorMessage(err))
	fs.appendFile(filePath, fileContents, function(err){
		if(err){
			vscode.window.showErrorMessage(err)
		}
	})
}

module.exports = {
	fnsToClojure,
	addToFnFile
};