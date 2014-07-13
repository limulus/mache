Mache   [![Build Status](https://travis-ci.org/limulus/mache.png?branch=master)](https://travis-ci.org/limulus/mache)
=====

A **mache** is an in-memory, self-invalidating, file-to-object cache.

Synopsis
--------

This Node.js module attempts to solve the problem of needing fast and up-to-date access to objects created from files in a given directory. When you create a Mache instance, you specify a **base directory** where the files are stored and an **object creation callback**. Objects created by your object creation callback are **automatically cached** and subsequent requests for the object associated with the given file are retrieved from the cache. When the underlying file changes, your object creation callback is automatically called again and the cache is updated.


Installation
------------

```shell
npm install mache
```

Example
-------

In the following example we create a mache for template directory containing HTML template files. We then use the mache to get a Template instance object for the `page.html` template and render it.

```javascript
var mache = require('mache')
  , Template = require('./lib/template.js')

// Create a mache instance for our templates directory.
var templatesMache = mache.create('./templates', createTemplateObj)

// Define the object creation funciton for the templates mache.
function createTemplateObj (fullTemplatePath, templateData, macheUpdateCallback) {
    var templateObj = new Template(templateData)
    return macheUpdateCallback(templateObj)
}

// Get a template object from the mache for the given file, relative
// to the templates directory.
templatesMache.get('page.html', function (err, template) {
    // The mache will pass along any file system related errors. You
    // should handle them appropriately.
    if (err) throw err

    // Render the up-to-date template object.
    template.render({ TITLE: 'Our Brand New Site', BODY: '<p>Hello world!</p>' })
})
```

Functions
---------

### mache.create(baseDir, objectCreationCallback)

Returns a Mache instance with the given base directory path and object creation callback. The object creation callback takes three arguments:

  * A string with the full path to the file.
  * A string containing the contents of the file.
  * A mache update callback, which you must call passing it the new object.


### get(filePath, callback)

Retrieves the object for the given file path. Note that the file path must be relative to the base directory. If the file is outside the base directory (i.e. `../foo.txt`), then the callback will be called with an error argument. You may also receive errors if there was trouble reading the file due to permisions or the file not existing.

Callback arguments:

  * An error object.
  * The object for the given file, as created by the object creation callback.

Returns a standard promise object which can be used in lieu of providing a callback.


### baseDir(callback)

Calls the given callback with two arguments:

  * An error object if there was an error finding the real path to the base directory.
  * The real path to the base directory.


Events
------

Mache instance objects inherit from EventEmitter, so you can listen for events via the `on()` method.

### invalidation

This event is emitted when an object has been removed from the cache, either due to the underlying file getting updated or deleted. The relevant object is passed to the even handler. This is useful for performing cleanup tasks for an object that is no longer being retained by the Mache instance.

