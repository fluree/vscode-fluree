
const fs = require('fs');
const cp = require('child_process');
const vscode = require('vscode');

function checkInitiateProject(root){
	return new Promise(function(resolve, reject){
	// Check if project.clj already exists
	if(fs.existsSync(`${root}/project.clj`)){
		resolve();
	} else {
		// else create new leiningen project
		const splitIndex = root.lastIndexOf("/");
		const appName = root.substr(splitIndex + 1);
		vscode.window.showInformationMessage("Creating new Clojure project.")
		cp.execSync(`cd ${root};cd ..;lein new smart-function ${appName} --force`, (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage('Error: ' + err);
				reject();
			}
			resolve();
		})
	}})
}


function createFuncFileHeaders(dirName){
	return `(ns ${dirName}.customfunctions
		(:refer-clojure :exclude [max min get inc dec + - * / quot mod == rem contains? get-in < <= > >=
								  boolean re-find and or count str nth rand nil? hash-set empty? not])
		(:require [smartfunctions.fns :refer :all]
				  [clojure.tools.logging :as log])) \n \n`}

function createFnFile(cljFunctions, root){
	console.log("CALLING CREATE FN FILE")
	const splitIndex = root.lastIndexOf("/");
	const appName = root.substr(splitIndex + 1);
	const dirName = appName.replace(/-/g, "_");
	const fileContents = createFuncFileHeaders(dirName) + cljFunctions;

	const filePath = `${root}/src/${dirName}/customfunctions.clj`
	fs.access(filePath, err => err ? 'does not exist' : 'exists'); 
	fs.writeFile(filePath, fileContents, function(err){
		if(err){
			console.log(err)
		}
	})
}

module.exports = {
	checkInitiateProject,
	createFnFile
};