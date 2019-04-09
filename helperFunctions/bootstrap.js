
const fs = require('fs');
const cp = require('child_process');
const vscode = require('vscode');
const parseJSON = require('./fetchDBInfo').parseJSON;

function initiateProject(root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	vscode.window.showInformationMessage("Creating new smart-function Clojure project.")
	let resp = cp.execSync(`cd ${root};cd ..;lein new smart-function ${appName} --force`)
	return resp.toString().trim();
}

function checkInitiateProject(root){
	let promise = new Promise((resolve, reject) => {
		// Check if project.clj already exists
		let projectExists = fs.existsSync(`${root}/project.clj`);
		
		if(projectExists){
			let version = fs.readFileSync(`${root}/.VERSION`, 'utf8');
			version = version.trim();
			let latestVersion; 

			fetch('https://clojars.org/api/artifacts/smart-function/lein-template')
			.then(res => parseJSON(res))
			.then(res => res.json)
			.then(res => latestVersion = res.latest_version.trim())
			.then(res => {
				if(version !== latestVersion){
					vscode.window.showInputBox({prompt: `You have version ${version} of the Fluree Smart Function project. \n The latest version is ${latestVersion}. \n Would you like to update to the latest version? \n Y/N \n Note all functions not saved to the database will be lost. `})
					.then(res => {
						let lowerCaseRes = res.toLowerCase();
						lowerCaseRes = lowerCaseRes.trim()
						if(res === "y" || res === "yes"){
							return initiateProject(root)
						}
					})
					.catch(err => reject(err))
				}
				resolve();
			})
			.catch(err => reject(err))
		} else {
			let resp = initiateProject(root);
			if(resp === "Generating fresh 'lein leiningen' smart-function project."){
				resolve()
			} else {
				reject(resp)
			}
		}
	})

	return promise
}


function createFuncFileHeaders(dirName){
	return `(ns ${dirName}.custom_functions
		(:refer-clojure :exclude [max min get inc dec + - * / quot mod == rem contains? get-in < <= > >=
								  boolean re-find and or count str nth rand nil? hash-set empty? not])
		(:require [${dirName}.fns :refer :all]
				  [clojure.tools.logging :as log])) \n \n`}

function createFnFile(cljFunctions, root){
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");
	const fileContents = createFuncFileHeaders(dirName) + cljFunctions;

	const filePath = `${root}/src/${dirName}/custom_functions.clj`

	fs.writeFileSync(filePath, fileContents);
	return filePath
}

module.exports = {
	checkInitiateProject,
	createFnFile
};