"use strict"

var mache = require('../index.js')
  , assert = require('assert')
  , temp = require('temp')
  , fs = require('fs')
  , path = require('path')

// Automatically track and cleanup files at exit.
temp.track();

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
		return macheUpdate(testObj)
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
                assert.ifError(err)
                assert.strictEqual(expectedObj, cachedObj)
                done()
            })
        })
    })

    it("should return a new object if the underlying file has changed", function (done) {
        setModifiedTimeOnTestFileToDistantPast('2.json')
        testMache.get('2.json', function (err, objFromFirstGet) {
            assert.ifError(err)

            setModifiedTimeOnTestFileToNow('2.json')
            testMache.get('2.json', function (err, objFromSecondGet) {
                assert.ifError(err)

                assert.notStrictEqual(objFromFirstGet, objFromSecondGet)
                done()
            })
        })
    })

    it("should return the cached object when object creation callback is in-flight (to prevent cache stampedes)", function (done) {
        // To test this, we make a object creation callback that is slow on
        // the first call, but fast on subsequent calls. Calling mache.get()
        // twice, we make sure the object from the first get is the first
        // object that gets created.

        var objectsCreated = 0
        testMache = mache.create(testDir, function (filePath, data, macheUpdate) {
            var obj = { id: objectsCreated }
            if (objectsCreated === 0) {
                setTimeout(function () { macheUpdate(obj) }, 20)
            }
            else {
                macheUpdate(obj)
            }
            objectsCreated += 1
        })

        var obj1, obj2
        testMache.get('1.json', function (err, obj) {
            obj1 = obj
            runAssertionsIfDone()
        })
        testMache.get('1.json', function (err, obj) {
            obj2 = obj
            runAssertionsIfDone()
        })

        function runAssertionsIfDone () {
            if (obj1 && obj2) {
                assert.strictEqual(obj1.id, obj2.id)
                assert.strictEqual(obj1.id, 0)
                done()
            }
        }
    })

    it("should return a promise object that gets resolved on success", function (done) {
        testMache.get('2.json').then(function (obj) {
            assert(obj)
            done()
        }, function (err) {
            assert.ifError(err)
            done()
        })
    })

    it("should return a promise object that gets rejected on failure", function (done) {
        testMache.get('foo.json').then(function (obj) {
            assert.ifError(obj)
            done()
        }, function (err) {
            assert(err)
            done()
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

    it("should return the same directory on subsequent calls", function (done) {
        testMache.baseDir(function (err, firstResult) {
            assert.ifError(err)
            assert.ok(firstResult)

            testMache.baseDir(function (err, secondResult) {
                assert.ifError(err)
                assert.ok(secondResult)

                assert.strictEqual(firstResult, secondResult)
                done()
            })
        })
    })
})

describe("#on invalidation", function () {
    it("should call the invalidation callback with the old object when a file changes", function (done) {
        var objFromFirstGet
          , invalidationEventFired

        testMache.on('invalidation', function (err, invalidatedObj) {
            assert.ifError(err)
            assert.ok(objFromFirstGet)
            assert.ok(invalidatedObj)
            assert.strictEqual(objFromFirstGet, invalidatedObj)
            invalidationEventFired = true
        })

        testMache.get('2.json', function (err, _objFromFirstGet) {
            assert.ifError(err)

            objFromFirstGet = _objFromFirstGet

            setModifiedTimeOnTestFileToDistantPast('2.json')
            testMache.get('2.json', function (err, objFromSecondGet) {
                assert.ifError(err)
                assert.ok(invalidationEventFired)
                done()
            })
        })
    })
})

function setModifiedTimeOnTestFileToDistantPast (testFile) {
    var testFilePath = path.join(testDir, testFile)
    var oldTime = new Date("June 4, 1981 18:00:00")
    fs.utimesSync(testFilePath, oldTime, oldTime)
}

function setModifiedTimeOnTestFileToNow (testFile) {
    var testFilePath = path.join(testDir, testFile)
    var newTime = new Date()
    fs.utimesSync(testFilePath, newTime, newTime)
}
