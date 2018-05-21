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
const fs = require('fs')

const writeAddressBookSync = function (data) {
  fs.writeFileSync(`~/.friendshipcoin/receiving_address_list.json`, JSON.stringify(data))
  return true
}
let wut = false
if (wut === true) writeAddressBookSync()

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
  baseDir
}, (err, lib) => {
  lib.util.setupFolder()
  lib.menu.addMenu()
  lib.window.createMainWindow()

  app.on('window-all-closed', () => {
    lib.wallet.stop(app.quit)
  })

  // start the wallet daemon
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
      lib.wallet.loaded = true
      lib.menu.configureWalletMenu()
      lib.wallet.listAddressGroupings((err, addy) => {
        console.log(addy)
      })
    }
  )
})
