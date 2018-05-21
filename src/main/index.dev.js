'use strict'

if (process.env.NODE_ENV !== 'development') global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
// setup the main electron modules
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell
} = require('electron')
require('electron-context-menu')()

const async = require('async')
const baseDir = __dirname
// set the main window Url
const winURL = process.env.NODE_ENV === 'development' ? 'http://localhost:9080' : `file://${baseDir}/index.html`
// fire up the app library
const Lib = require('./lib')
// pass it in some initial config things
const lib = new Lib()
lib.init({
  ipcMain,
  Menu,
  shell,
  app,
  BrowserWindow,
  winURL,
  baseDir
}, (err, lib) => {
  lib.util.setupFolder()
  // lib.menu.addMenu()
  // start the wallet daemon
  lib.wallet.start(() => {
    let connected = false
    console.log('try to connect to wallet')
    async.until(
      () => {
        return connected
      },
      (done) => {
        lib.wallet.getInfo((err, data) => {
          if (err) {
            return setTimeout(done, 1000)
          }
          connected = true
          done()
        })
      },
      (err, connected) => {
        console.log('==== CONNECTED ====')
        lib.menu.configureWalletMenu()
      }
    )
  })
  // create the browser window
  app.on('ready', lib.window.createMainWindow)

  app.on('window-all-closed', () => {
    lib.wallet.stop(app.quit)
  })

  app.on('activate', () => {
    if (lib.window.mainWindow === null) {
      lib.window.createMainWindow()
    }
  })
})
