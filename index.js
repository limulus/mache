"use strict"

var fs = require('fs')
  , path = require('path')
  , parents = require('parents')

/**
 * Caches objects created from files in a given directory.
 * @private
 * @constuctor
 * @param {string} dirPath
 * @param {function(string, string, function(*))} objectCreator
 */
var Mache = function (baseDirPath, objectCreator) {
	this._suppliedBaseDirPath = baseDirPath
    this._baseDir = null
    this._objectCreator = objectCreator
}

/**
 * Gets the full path to the directory this mache is using.
 * @public
 * @param {function(Error?, string)} result
 */
Mache.prototype.path = function (result) {
    if (this._baseDir) {
        return result(undefined, this._baseDir)
    }
    else {
        fs.realpath(this._suppliedBaseDirPath, function (err, actualPath) {
            if (!err) {
                this._baseDir = path.normalize(actualPath)
                return result(err, this._baseDir)
            }
            else {
                return result(err)
            }
        }.bind(this))
    }
}

/**
 * @public
 * @param {string} file
 * @param {function(Error?, *)} result
 */
Mache.prototype.get = function (file, result) {
    this.path(function (err, baseDir) {
        var fullFilePath = path.join(baseDir, file)

        var fileIsInBaseDir = parents(fullFilePath).some(function (parentDir) {
            return parentDir === baseDir
        })

        if (!fileIsInBaseDir) {
            var msg = 'File "' + fullFilePath
              + '" is outside base directory "' + baseDir + '".'
            return result(new Error(msg), undefined)
        }
        
        fs.readFile(fullFilePath, function (err, data) {
            var objectCreator = this._objectCreator

            if (err) {
                return result(err)
            }
            else {
                objectCreator(file, data, function (obj) {
                    // ... add obj to cache
                    return result(undefined, obj)
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
