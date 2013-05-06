"use strict"

module.exports = function (templateData) {
    this._data = templateData
}

module.exports.prototype.render = function (mappings) {
    var renderBuffer = this._data + ""
    Object.keys(mappings).forEach(function (key) {
        var keyRegex = new RegExp("%"+key+"%", "g")
        renderBuffer = renderBuffer.replace(keyRegex, mappings[key])
    }.bind(this))
    console.log(renderBuffer)
}
