"use strict"

/**
 * @constuctor
 */
var Mache = module.exports = function (path) {
	this._path = path
}

/**
 * @return {string}
 */
Mache.prototype.path = function () {
	return this._path
}

/**
 * @return {Mache}
 */
Mache.create = function (path) {
	return new Mache(path)
}
