
module.exports = function (main) {
  const self = this
  self.main = main

  self.init = function (app, allDone) {
    self.app = app
    allDone()
  }

  self.addMenu = () => {
    const menuTemplate = [
      {
        label: 'FriendshipCoin',
        id: 'main',
        submenu: [
          {
            label: 'Quit',
            click () {
              self.app.wallet.stop(() => {
                self.main.app.quit()
              })
            }
          }
        ]
      },
      {
        label: 'Wallet',
        id: 'wallet',
        submenu: [
          {
            label: 'Encrypt',
            enabled: false,
            click () {
              self.app.window.sendMessage('OPEN_ENCRYPT_WINDOW')
            }
          },
          {
            label: 'Unlock',
            visible: false,
            click () {
              self.app.window.sendMessage('OPEN_UNLOCK_WINDOW')
            }
          },
          {
            label: 'Lock',
            visible: false,
            click () {
              self.app.wallet.lock((err, res) => {
                self.app.window.sendMessage('SHOW_ALERT', 'Wallet Locked', 'Your wallet has been locked.  Staking will halt until you Unlock for Staking again.')
                self.walletLocked()
              })
            }
          }
        ]
      },
      {
        label: 'Edit',
        role: 'editMenu',
        id: 'edit'
      },
      {
        label: 'Window',
        role: 'windowMenu',
        id: 'window'
      },
      {
        role: 'help',
        id: 'help',
        submenu: [
          {
            label: 'Debug Window',
            click () {
              self.app.window.sendMessage('OPEN_DEBUG_WINDOW')
            }
          },
          {
            label: 'FriendshipCoin Wiki',
            click () {
              self.main.shell.openExternal('https://github.com/friendshipCoin/friendshipcoin-core/wiki')
            }
          }
        ]
      }
    ]

    self.menu = self.main.Menu.buildFromTemplate(menuTemplate)
    self.main.Menu.setApplicationMenu(self.menu)
  }

  self.configureWalletMenu = function () {
    let walletMenu = self.menu.getMenuItemById('wallet')
    // check if the wallet is locked or unlocked and update the menu items
    self.app.wallet.getInfo((err, data) => {
      // wallet is encrypted so disable the "Encrypt" menu item
      console.log(data)
      if (data.hasOwnProperty('unlocked_until')) {
        let encryptOption = walletMenu.submenu.items.filter((i) => {
          return i.label === 'Encrypt'
        })[0]

        encryptOption.enabled = false
        self.walletLocked()
      } else {
        // Wallet is unlocked to disable the unlock option
        self.walletUnlocked(false)
      }
    })
  }

  self.walletUnlocked = function (encrypted = true) {
    let walletMenu = self.menu.getMenuItemById('wallet')
    let unlockOption = walletMenu.submenu.items.filter((i) => {
      return i.label === 'Unlock'
    })[0]
    unlockOption.visible = false

    if (!encrypted) {
      let encryptOption = walletMenu.submenu.items.filter((i) => {
        return i.label === 'Encrypt'
      })[0]
      encryptOption.enabled = true
    } else {
      let lockOption = walletMenu.submenu.items.filter((i) => {
        return i.label === 'Lock'
      })[0]
      lockOption.visible = true
    }
  }

  self.walletLocked = function () {
    let walletMenu = self.menu.getMenuItemById('wallet')
    let unlockOption = walletMenu.submenu.items.filter((i) => {
      return i.label === 'Unlock'
    })[0]
    unlockOption.visible = true

    let lockOption = walletMenu.submenu.items.filter((i) => {
      return i.label === 'Lock'
    })[0]
    lockOption.visible = false
  }
}
