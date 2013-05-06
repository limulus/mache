"use strict"

var mache = require('../index.js')
  , assert = require('assert')
  , temp = require('temp')
  , fs = require('fs')
  , path = require('path')

// Temporary directory to base our mache out of.
var testDir = fs.realpathSync(temp.mkdirSync())

// Create some files in the temporary directory so we have something to test.
var testData1 = '{"id": 1}'
fs.writeFileSync(path.join(testDir, '1.json'), testData1)
var testData2 = '{"id": 2}'
fs.writeFileSync(path.join(testDir, '2.json'), testData2)

// Set up the mache object we'll use for most of these tests.
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

    it("should return an error if the requested file does not exist", function (done) {
        testMache.get('foo.json', function (err, testObjFoo) {
            assert.ok(err)
            done()
        })
    })

    it("should return an error if the requested file is outside the base directory", function (done) {
        var outsideJSONFile = path.join(__dirname, 'data/foo.json')
        var relativePathToOutsideFile = path.relative(testDir, outsideJSONFile)
        testMache.get(relativePathToOutsideFile, function (err, testObjFoo) {
            assert.ok(err)
            done()
        })
    })

    it("should return the exact same object if underlying file has not changed", function (done) {
        testMache.get('1.json', function (err, expectedObj) {
            assert.ifError(err)
            testMache.get('1.json', function (err, cachedObj) {
                debugger
                assert.ifError(err)
                assert.strictEqual(expectedObj, cachedObj)
                done()
            })
        })
    })

    it("should return a new object if the underlying file has changed", function (done) {
        var testFilePath = path.join(testDir, '2.json')
        var oldTime = new Date("June 4, 1981 18:00:00")
        fs.utimesSync(testFilePath, oldTime, oldTime)

        testMache.get('2.json', function (err, objFromFirstGet) {
            assert.ifError(err)

            var newTime = new Date()
            fs.utimesSync(testFilePath, newTime, newTime)

            testMache.get('2.json', function (err, objFromSecondGet) {
                assert.ifError(err)

                assert.notStrictEqual(objFromFirstGet, objFromSecondGet)
                done()
            })
        })
    })
})

describe("#baseDir", function () {
    it("should return the full path even when created with a relative path", function (done) {
        // Make our own testMache using a relative path
        testMache = mache.create('.', function (fp, d, macheUpdate) {
            macheUpdate(null)
        })

        var actualPath = fs.realpathSync('.')
        testMache.baseDir(function (err, machePath) {
            assert.ifError(err)
            assert.strictEqual(actualPath, machePath)
            done()
        })
    })

    it("should return an error if the directory doesn't exist", function (done) {
        // Make our own testMache using a non-existent path
        testMache = mache.create('./does/not/exist/i/hope', function (fp, d, macheUpdate) {
            macheUpdate(null)
        })

        testMache.baseDir(function (err, machePath) {
            assert.ok(err)
            done()
        })
    })
})
