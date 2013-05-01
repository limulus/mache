"use strict"

var fs = require('fs')
  , path = require('path')

/**
 * @constuctor
 * @param {string} dirPath
 * @param {function(string, string, function(*))} objectCreator
 */
var Mache = module.exports = function (dirPath, objectCreator) {
	this._dirPath = dirPath
    this._objectCreator = objectCreator
}

/**
 * @return {string}
 */
Mache.prototype.path = function () {
	return this._dirPath
}

/**
 * @param {string} file
 * @param {function(Error?, *)} returnResult
 */
Mache.prototype.get = function (file, returnResult) {
    var fullFilePath = path.join(this.path(), file)
    fs.readFile(fullFilePath, function (err, data) {
        var objectCreator = this._objectCreator

        if (err) {
            returnResult(err)
        }
        else {
            objectCreator(file, data, function (obj) {
                // ... add obj to cache
                returnResult(undefined, obj)
            })
        }
    }.bind(this))
}

/**
 * @param {string} dirPath
 * @param {function(string, string, function(*))} objectCreator
 * @return {Mache}
 */
Mache.create = function (dirPath, objectCreator) {
	return new Mache(dirPath, objectCreator)
}
