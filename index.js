"use strict"

var fs = require('fs')
  , path = require('path')

/**
 * Caches objects created from files in a given directory.
 * @private
 * @constuctor
 * @param {string} dirPath
 * @param {function(string, string, function(*))} objectCreator
 */
var Mache = function (dirPath, objectCreator) {
	this._suppliedPath = dirPath
    this._realPath = null
    this._objectCreator = objectCreator
}

/**
 * Gets the full path to the directory this mache is using.
 * @public
 * @param {function(Error?, string)} callback
 */
Mache.prototype.path = function (callback) {
    if (this._realPath) {
        callback(undefined, this._realPath)
    }
    else {
        fs.realpath(this._suppliedPath, function (err, actualPath) {
            this._realPath = actualPath
            callback(err, this._realPath)
        }.bind(this))
    }
}

/**
 * @public
 * @param {string} file
 * @param {function(Error?, *)} returnResult
 */
Mache.prototype.get = function (file, returnResult) {
    this.path(function (err, fullDirPath) {
        var fullFilePath = path.join(fullDirPath, file)
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
    }.bind(this))
}

/**
 * @public
 * @param {string} dirPath
 * @param {function(string, string, function(*))} objectCreator
 * @return {Mache}
 */
module.exports.create = function (dirPath, objectCreator) {
	return new Mache(dirPath, objectCreator)
}
