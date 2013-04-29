"use strict"

var mache = require('../index.js')
  , assert = require('assert')
  , Tempdir = require('temporary/lib/dir')

var testDir = new Tempdir
process.on('exit', function () {
	testDir.rmdirSync()
})

describe('mache.create', function () {
	var testDataCache

	beforeEach(function () {
		testDataCache = mache.create(testDir.path)
	})

	it('should create a new Mache object with the given path', function () {
		assert.strictEqual(testDataCache.path(), testDir.path)
	})
})