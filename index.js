"use strict"

var fs = require('fs')
  , path = require('path')
  , subdir = require('subdir')

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
    this._stringContentForFile(file, function (err, data) {
        if (err) return result(err)

        var objectCreator = this._objectCreator
        objectCreator(file, data, function (obj) {
            // ... add obj to cache
            return result(undefined, obj)
        })
    }.bind(this))
}

/**
 * @private
 * @param {string} file
 * @param {function(Error?, string)} result
 */
Mache.prototype._stringContentForFile = function (file, result) {
    this._fullPathForFile(file, function (err, fullFilePath) {
        if (err) return result(err)
        fs.readFile(fullFilePath, result)
    }.bind(this))
}

/**
 * @private
 * @param {string} file
 * @param {function(Error?, string)} result
 */
Mache.prototype._fullPathForFile = function (file, result) {
    this.path(function (err, baseDir) {
        if (err) return result(err)

        var fullFilePath = path.join(baseDir, file)
        if (!subdir(baseDir, fullFilePath)) {
            var msg = 'File "' + fullFilePath
              + '" is outside base directory "' + baseDir + '".'
            return result(new Error(msg))
        }
        return result(null, fullFilePath)
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
