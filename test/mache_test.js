"use strict"

var mache = require('../index.js')
  , assert = require('assert')
  , temp = require('temp')
  , fs = require('fs')
  , path = require('path')

// Temporary directory to base our mache out of.
var testDir = temp.mkdirSync()

// Create some files in the temporary directory so we have something to test.
var testData1 = '{"id": 1}'
fs.writeFileSync(path.join(testDir, '1.json'), testData1)

var testMache
beforeEach(function () {
	testMache = mache.create(testDir, function (filePath, data, macheUpdate) {
		var testObj = JSON.parse(data)
		testObj._path = filePath
		macheUpdate(testObj)
	})
})

describe('#get', function () {
	it('should return the correct object for the given file', function (done) {
		testMache.get('1.json', function (err, testObj1) {
			assert.ifError(err)
			assert.strictEqual(testObj1.id, 1)
			done()
		})
	})
})

describe("#path", function () {
    it("should return the full path even when created with a relative path", function (done) {
        // Recreate testMache using a relative path
        testMache = mache.create('.', function (fp, d, macheUpdate) {
            macheUpdate(null)
        })

        var actualPath = fs.realpathSync('.')
        testMache.path(function (err, machePath) {
            assert.ifError(err)
            assert.strictEqual(actualPath, machePath)
            done()
        })
    })

    it("should return an error if the directory doesn't exist", function (done) {
        // Recreate testMache using a non-existent path
        testMache = mache.create('./does/not/exist/i/hope', function (fp, d, macheUpdate) {
            macheUpdate(null)
        })

        testMache.path(function (err, machePath) {
            assert.ok(err)
            done()
        })
    })
})
