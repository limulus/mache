"use strict"

var fs = require('fs')
  , path = require('path')
  , subdir = require('subdir')
  , EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , Promise = require('promise')

/**
 * @public
 * @param {string} dirPath
 * @param {function(string, string, function(*))} objectCreator
 * @return {Mache}
 */
module.exports.create = function (dirPath, objectCreator) {
    return new Mache(dirPath, objectCreator)
}

/**
 * Caches objects created from files in a given directory.
 * @private
 * @constuctor
 * @param {string} dirPath
 * @param {function(string, string, function(*))} objectCreator
 */
var Mache = function (baseDirPath, objectCreator) {
    EventEmitter.call(this)

    this._suppliedBaseDirPath = baseDirPath
    this._baseDir = null
    this._objectCreator = objectCreator
    this._cache = {}
    this._fullPathCache = {}
    this._getInProgressPromise = {}
}
inherits(Mache, EventEmitter)

/**
 * Gets the full path to the base directory this mache is using.
 * @public
 * @param {function(Error?, string)} result
 */
Mache.prototype.baseDir = function (result) {
    if (this._baseDir) {
        return result(null, this._baseDir)
    }

    fs.realpath(this._suppliedBaseDirPath, function (err, actualPath) {
        if (err) return result(err)

        this._baseDir = path.normalize(actualPath)
        return result(err, this._baseDir)
    }.bind(this))
}

/**
 * @public
 * @param {string} file
 * @param {function(Error?, *)} result?
 * @return {Promise}
 */
Mache.prototype.get = function (file, result) {
    if (! this._getInProgressPromise[file]) {
        this._getInProgressPromise[file] = this._doGetForFile(file)
    }

    this._getInProgressPromise[file].then(function (obj) {
        this._getInProgressPromise[file] = undefined
        if (result) return result(null, obj)
    }.bind(this), function (err) {
        this._getInProgressPromise[file] = undefined
        if (result) return result(err)
    }.bind(this))

    return this._getInProgressPromise[file]
}

/**
 * Compares file modification times, and updates the cache if necessary.
 * @private
 * @param {string} file
 * @return {Promise}
 */
Mache.prototype._doGetForFile = function (file) {
    return new Promise(function (resolve, reject) {
        var cachedMtime, cachedObj
        if (this._cache[file]) {
            cachedMtime = this._cache[file][0]
            cachedObj = this._cache[file][1]
        }

        this._mtimeForFile(file, function (err, currentMtime) {
            if (err) return reject(err)

            if (cachedMtime === currentMtime) {
                return resolve(cachedObj)
            }
            else {
                if (cachedObj) {
                    this._invalidateCachedObjForFile(cachedObj, file)
                }

                this._updateCacheForFileWithMtime(file, currentMtime)
                    .then(resolve, reject)
            }
        }.bind(this))
    }.bind(this))
}

/**
 * @private
 * @param {string} file
 * @param {function(Error?, number)}
 */
Mache.prototype._mtimeForFile = function (file, result) {
    this._fullPathForFile(file, function (err, fullFilePath) {
        if (err) return result(err)

        fs.stat(fullFilePath, function (err, stats) {
            if (err) return result(err)

            return result(null, stats.mtime.getTime())
        }.bind(this))
    }.bind(this))
}

/**
 * @private
 * @param {string} file
 * @param {number} mtime
 * @param {function(*)} resolve
 * @param {function(*)} reject
 */
Mache.prototype._updateCacheForFileWithMtime = function (file, mtime) {
    return new Promise(function (resolve, reject) {
        this._stringContentForFile(file, function (err, data) {
            if (err) return reject(err)

            var objectCreator = this._objectCreator
            objectCreator(file, data, function (obj) {
                this._cache[file] = [mtime, obj]
                return resolve(obj)
            }.bind(this))
        }.bind(this))
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
    if (this._fullPathCache[file]) {
        return result(null, this._fullPathCache[file])
    }

    this.baseDir(function (err, baseDir) {
        if (err) return result(err)

        var fullFilePath = path.join(baseDir, file)
        if (!subdir(baseDir, fullFilePath)) {
            var msg = 'File "' + fullFilePath
              + '" is outside base directory "' + baseDir + '".'
            return result(new Error(msg))
        }

        this._fullPathCache[file] = fullFilePath
        return result(null, fullFilePath)
    }.bind(this))
}

/**
 * Invalidates the cached object associated with the sepcified file.
 * @private
 * @param {obj} obj
 * @param {string} file
 */
Mache.prototype._invalidateCachedObjForFile = function (obj, file) {
    this._cache[file] = null
    this.emit('invalidation', null, obj)
}
