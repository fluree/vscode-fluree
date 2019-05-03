const fetch = require('isomorphic-fetch');
const vscode = require('vscode');

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
		auth: { select: ["*", {"_auth/roles": ["*", {"_role/rules": ["*", {"_rule/fn": ["*"]}]}]}], from: "_auth"}
	};

	const fetchOpts = { 
		headers: headers,
		method: "POST", 
		body: JSON.stringify(query)
	};

	return fetch(`${baseEndpoint}/multi-query`, fetchOpts)
	.then(res => parseJSON(res))
	.then(res => res.json)
	.catch(err => vscode.window.showErrorMessage(JSON.stringify(err.message)))
}

module.exports = {
	getEndpoint,
	parseJSON,
	getSchema
};