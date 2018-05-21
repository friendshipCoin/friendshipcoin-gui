module.exports = function (main) {
  const self = this
  self.mainWindow = null
  self.main = main

  self.init = function (app, allDone) {
    self.app = app
    allDone()
  }

  self.createMainWindow = function () {
    if (self.mainWindow !== null) return true
    if (!self.main.app.isReady()) return setTimeout(self.createMainWindow, 500)

    // set the main window Url
    const winURL = process.env.NODE_ENV === 'development'
      ? 'http://localhost:9080'
      : `file://${self.main.baseDir}/index.html`

    console.log(self.main)
    self.mainWindow = new self.main.BrowserWindow({
      title: 'FriendshipCoin - Wallet',
      backgroundColor: '#000',
      useContentSize: true,
      width: 1200,
      height: 600,
      minWidth: 1200,
      minHeight: 600,
      icon: `${self.main.baseDir}/static/img/icons/64x64.png`
    })

    self.mainWindow.loadURL(winURL)

    self.mainWindow.on('closed', () => {
      self.mainWindow = null
    })
  }

  self.sendMessage = function (message, ...args) {
    self.mainWindow.webContents.send(message, ...args)
  }
}
