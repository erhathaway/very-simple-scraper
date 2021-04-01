const path = require('path')

exports.getKind = (moduleName, filename) =>  moduleName.filename.slice(filename.lastIndexOf(path.sep)+1, moduleName.filename.length -3);

exports.getDomain = (filename) => {
    const parts = filename.split('/');
    return parts.slice(parts.length - 2, parts.length -1).join('')
}