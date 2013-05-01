"use strict"

var mache = require('../index.js')
  , assert = require('assert')
  , temp = require('temp')
  , fs = require('fs')
  , path = require('path')

var testDir = temp.mkdirSync()

var testData1 = '{"id": 1}'
fs.writeFileSync(path.join(testDir, '1.json'), testData1)

var testDataCache
beforeEach(function () {
	testDataCache = mache.create(testDir, function (path, data, macheUpdate) {
		var testObj = JSON.parse(data)
		testObj._path = path
		macheUpdate(testObj)
	})
})

describe('mache.create', function () {
	it('should create a new Mache object with the given path', function () {
		assert.strictEqual(testDataCache.path(), testDir)
	})
})

describe('#get', function () {
	it('should return the correct object for the given file', function (done) {
		testDataCache.get('1.json', function (err, testObj1) {
			if (err) throw err
			assert.strictEqual(testObj1.id, 1)
			done()
		})
	})
})
