var mache = require('../index.js')
  , Template = require('./lib/template.js')

// Create a mache instance for our templates directory.
var templatesMache = mache.create('./example/templates', createTemplateObj)

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
