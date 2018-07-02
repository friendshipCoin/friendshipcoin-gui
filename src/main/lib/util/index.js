const fs = require('fs')

module.exports = function (main) {
  const self = this

  self.init = function (app, allDone) {
    self.app = app
    allDone()
  }

  self.setupFolder = function () {
    if (!self.fileExists(self.app.mydir)) return fs.mkdirSync(self.app.mydir)
  }

  self.randomPassword = function (length = 10) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let text = ''

    for (let i = 0; i < length; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  self.fileExists = function (path) {
    return fs.existsSync(path)
  }

  self.copyFile = function (sourceFile, destFile, allDone) {
    let source = fs.createReadStream(sourceFile)
    let dest = fs.createWriteStream(destFile)

    source.pipe(dest)
    source.on('end', allDone)
  }
}
