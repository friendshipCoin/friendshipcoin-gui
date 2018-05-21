const fs = require('fs')
const _ = require('lodash')
const async = require('async')

module.exports = function (main) {
  const self = this
  self.main = main

  self.init = function (app, allDone) {
    self.app = app
    allDone()
  }

  self.start = function (app, allDone) {
    self.main.ipcMain.on('RUN_COMMAND', (event, arg) => {
      self.app.wallet.runCommand(arg.command, (error, stdout, stderr) => {
        event.returnValue = {
          error,
          stdout,
          stderr
        }
      })
    })

    self.main.ipcMain.on('GET_INFO', (event, arg) => {
      self.app.wallet.getInfo((err, data) => {
        event.returnValue = data
      })
    })

    self.main.ipcMain.on('GET_STAKING_INFO', (event, arg) => {
      self.app.wallet.getStakingInfo((err, data) => {
        event.returnValue = data
      })
    })

    self.main.ipcMain.on('GET_LAST_BLOCK', (event, arg) => {
      self.app.wallet.getBlockCount((err, data) => {
        self.app.wallet.getBlockByNumber(data, (err, block) => {
          event.returnValue = block
        })
      })
    })

    self.main.ipcMain.on('CHECK_WALLET_LOADED', (event, arg) => {
      event.returnValue = self.app.wallet.loaded
    })

    self.main.ipcMain.on('GET_BALANCE', (event, arg) => {
      self.app.wallet.getBalance((err, data) => {
        event.returnValue = data
      })
    })

    self.main.ipcMain.on('LIST_TRANSACTIONS', (event, arg) => {
      self.app.wallet.listTransactions((err, data) => {
        event.returnValue = data
      })
    })

    self.main.ipcMain.on('LIST_ADDRESS_GROUPINGS', (event, arg) => {
      self.app.wallet.listAddressGroupings((err, data) => {
        event.returnValue = data
      })
    })

    self.main.ipcMain.on('GET_NEW_ADDRESS', (event, arg) => {
      self.app.wallet.getNewAddress(arg, (err, data) => {
        event.returnValue = data
      })
    })

    self.main.ipcMain.on('GET_RECEIVING_ADDRESS_LIST', (event, arg) => {
      console.log('GET THE LIST')
      async.parallel([
        function (done) {
          self.app.wallet.listAddressGroupings(function (err, res) {
            if (!res.length) return done(null, [])
            res = res[0]
            let groupings = res.map(function (a) {
              return {address: a[0], label: ''}
            })
            done(err, groupings)
          })
        },
        function (done) {
          fs.readFile(`${self.app.mydir}/receiving_address_list.json`, 'utf8', (err, contents) => {
            if (err || !contents) return done(null, [])
            done(null, JSON.parse(contents.trim()))
          })
        }
      ], function (err, results) {
        let walletAddresses = results[0]
        let savedAddressses = results[1]
        let returnAddresses = []

        // now take the list of wallet addresses and any address not already in the array to return , add it
        walletAddresses.forEach((checkAddress) => {
          if (!_.find(savedAddressses, {address: checkAddress.address})) savedAddressses.push(checkAddress)
        })

        async.each(savedAddressses, (checkAddress, next) => {
          self.app.wallet.validateAddress(checkAddress.address, (err, info) => {
            if (info.ismine) returnAddresses.push(checkAddress)
            next()
          })
        }, (err) => {
          fs.writeFileSync(`${self.app.mydir}/receiving_address_list.json`, JSON.stringify(returnAddresses))
          event.returnValue = returnAddresses
        })
      })
    })

    self.main.ipcMain.on('UPDATE_RECEIVING_ADDRESS_LIST', (event, arg) => {
      fs.writeFileSync(`${self.app.mydir}/receiving_address_list.json`, JSON.stringify(arg))
      event.returnValue = true
    })

    self.main.ipcMain.on('GET_ADDRESS_BOOK', (event, arg) => {
      fs.readFile(`${self.app.mydir}/address_book.json`, 'utf8', (err, contents) => {
        if (err || !contents) {
          event.returnValue = []
        } else {
          event.returnValue = JSON.parse(contents)
        }
      })
    })

    self.main.ipcMain.on('UPDATE_ADDRESS_BOOK', (event, arg) => {
      fs.writeFileSync(`${self.app.mydir}/address_book.json`, JSON.stringify(arg))
      event.returnValue = true
    })

    self.main.ipcMain.on('SEND_TO_ADDRESS', (event, arg) => {
      if (arg.protectMNCollat === true) {
        self.app.wallet.sendProtectMNCollateral(arg, (err, data) => {
          event.returnValue = {
            err: err ? { message: err.message } : null,
            data
          }
        })
      } else {
        self.app.wallet.sendToAddress(arg, (err, data) => {
          event.returnValue = {
            err: err ? { message: err.message } : null,
            data
          }
        })
      }
    })

    self.main.ipcMain.on('UNLOCK_WALLET', (event, arg) => {
      if (arg.stakingOnly) {
        self.app.wallet.enableStaking(arg, (err, data) => {
          // if (!err) self.app.menu.walletUnlocked()
          event.returnValue = {
            err: err ? { message: err.message } : null,
            data
          }
        })
      } else {
        self.app.wallet.unlock(arg, (err, data) => {
          if (!err) self.app.menu.walletUnlocked()
          event.returnValue = {
            err: err ? { message: err.message } : null,
            data
          }
        })
      }
    })

    self.main.ipcMain.on('LOCK_WALLET', (event, arg) => {
      self.app.wallet.lock(arg, (err, data) => {
        self.app.menu.walletLocked()
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('ENCRYPT_WALLET', (event, arg) => {
      self.app.wallet.encrypt(arg, (err, data) => {
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('GET_MASTERNODE_STATUS', (event, arg) => {
      self.app.wallet.getMasternodeStatus((err, data) => {
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('GET_MASTERNODE_CONFIG', (event, arg) => {
      let mnConfig = self.app.wallet.getMasternodeConfigSync()
      event.returnValue = {
        err: null,
        data: mnConfig
      }
    })

    self.main.ipcMain.on('NETWORK_MASTERNODES', (event, arg) => {
      self.app.wallet.getMasternodeList((err, data) => {
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('CHECK_MASTERNODE_OUTPUTS', (event, arg) => {
      self.app.wallet.masternodeOutputs((err, data) => {
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('GET_MASTERNODE_PRIVKEY', (event, arg) => {
      self.app.wallet.genKey((err, data) => {
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('CREATE_MASTERNODE', (event, arg) => {
      self.app.wallet.createMasternode(arg, (err, data) => {
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('START_MASTERNODE', (event, arg) => {
      self.app.wallet.masternodeStartMany((err, data) => {
        event.returnValue = {
          err: err ? { message: err.message } : null,
          data
        }
      })
    })

    self.main.ipcMain.on('QUIT', (event, arg) => {
      self.app.wallet.stop(self.main.app.quit)
    })
  }
}
