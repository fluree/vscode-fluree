
const fs = require('fs');
const vscode = require('vscode');
const fetch = require('isomorphic-fetch');

function writeToFile(filePath, txt){
	let body = typeof(txt) === "string" ? txt : JSON.stringify(txt, null, 2);
	return fs.writeFileSync(filePath, body);
}

function getConfigFile(res){
	let uri = res[0]["path"]
	return vscode.workspace.openTextDocument(uri).then(doc => {
		let text= doc.getText();
		text = JSON.parse(text)
		let { network, db, ip } = text;
		return { network: network, db: db, ip: ip };
	})
	.catch(err => vscode.window.showErrorMessage(err.message))
}

function getCurrentSelection(){
	// From https://stackoverflow.com/questions/44175461/get-selected-text-into-a-variable-vscode
	const editor = vscode.window.activeTextEditor; 
	var selection = editor.selection; 
	var text = editor.document.getText(selection);
	return text;
}

function parseJSON(response) {
	return response.json()
	.then(function (json) {
		const newResponse = Object.assign(response, { json });
		return newResponse;
	})
	.catch(err => {
		let error = err.message || err;
		vscode.window.showErrorMessage(JSON.stringify(error))
	})
  }

function sendReq(endpoint, body, root){
	const headers = {'Content-Type': 'application/json'}

	const fetchOpts = {  
		headers: headers,
		method: "POST", 
		body: body
	};

	return fetch(endpoint, fetchOpts)
	.then(res => parseJSON(res))
	.then(res => res.json)
	.then(res => {
		const filePath = `${root}/flureeResponse.txt`;
		writeToFile(filePath, res)
		return res;
	})
	.then(res => {
		let status = res.status;
		if(res.error === "db/invalid-action"){
			return vscode.window.showInformationMessage(` Are you using a version of Fluree that supports this endpoint? ${status ? `Status: ${status}`: '' }. Check flureeResponse.txt`)
		} else {
			return vscode.window.showInformationMessage(`Submitted. ${status ? `Status: ${status}`: '' } Check flureeResponse.txt`)
		}
	})
	.catch(err => {
		let error = err.message || err;
		vscode.window.showErrorMessage(JSON.stringify(error))
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


module.exports = {
	getConfigFile,
	getCurrentSelection,
	sendReq,
	checkExitPromise
};