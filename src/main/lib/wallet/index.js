const {exec} = require('child_process')
const jayson = require('jayson')
const extract = require('extract-zip')
const fs = require('fs')
const os = require('os')
const _ = require('lodash')
const async = require('async')

module.exports = function (main) {
  const self = this
  self.main = main

  self.init = function (app, allDone) {
    self.loaded = false
    self.pwd = app.mydir
    self.datadir = app.mydir
    self.daemondir = global.__static
    self.argString = `-datadir="${self.datadir}" -rpcuser=user -rpcpassword=simplepassword123 -rpcallowip=127.0.0.1`
    self.daemonFile = 'friendshipcoind'
    self.pathSep = '/'
    if (os.type() === 'Windows_NT') {
      self.daemonFile += '.exe'
      self.pathSep = '\\'
    }
    self.app = app
    self.usedInputs = []

    allDone()
  }

  self.start = (app, allDone) => {
    // handle building on windows vs mac / linux
    self.jclient = jayson.client.http({
      host: 'localhost',
      port: 58009,
      headers: {
        Authorization: 'Basic dXNlcjpzaW1wbGVwYXNzd29yZDEyMw=='
      },
      timeout: 5000
    })

    if (os.type() !== 'Windows_NT') {
      if (self.app.util.fileExists(`${self.datadir}${self.pathSep}friendshipcoind`)) return self.loadDaemon(allDone)
      self.app.util.copyFile(`${self.daemondir}${self.pathSep}friendshipcoind`, `${self.datadir}${self.pathSep}friendshipcoind`, () => {
        fs.chmodSync(`${self.datadir}${self.pathSep}${self.daemonFile}`, '0755')
        self.loadDaemon(allDone)
      })
    } else {
      // only run this if we're on windows
      if (fs.existsSync(`${self.datadir}${self.pathSep}friendshipcoind.exe`)) return self.loadDaemon(allDone)
      extract(`${self.daemondir}${self.pathSep}friendshipcoind.zip`, {dir: self.datadir}, (err) => {
        if (err) throw err
        self.loadDaemon(allDone)
      })
    }
  }

  self._request = function (action, params, allDone) {
    self.jclient.request(action, params, (err, res) => {
      if (err) return allDone(err, {})
      allDone(err, res.result)
    })
  }

  self.loadDaemon = (allDone) => {
    let mypath = `${self.datadir}${self.pathSep}${self.daemonFile}`
    // start the daemon
    self.getInfo((err, res) => {
      if (!err) return allDone(self)

      self.daemon = exec(`"${mypath}" ${self.argString}`, (error, stdout, stderr) => {
        if (error) throw error
      })
      allDone(self)
    })
  }

  self.getInfo = (allDone) => {
    self._request('getinfo', [], allDone)
  }
  self.getBlockCount = (allDone) => {
    self._request('getblockcount', [], allDone)
  }
  self.getBlockByNumber = (height, allDone) => {
    self._request('getblockbynumber', [height], allDone)
  }
  self.getBalance = (allDone) => {
    self._request('getbalance', [], allDone)
  }
  self.listTransactions = (allDone) => {
    self._request('listtransactions', [], allDone)
  }
  self.sendToAddress = (arg, allDone) => {
    self._request('sendtoaddress', [arg.address, arg.amount, '', ''], allDone)
  }
  self.getNewAddress = (label = '', allDone) => {
    self._request('getnewaddress', [], allDone)
  }

  self.validateAddress = (address, allDone) => {
    self._request('validateaddress', [address], allDone)
  }

  self.getStakingInfo = (allDone) => {
    self._request('getstakinginfo', [], allDone)
  }

  self.listAddressGroupings = (allDone) => {
    self._request('listaddressgroupings', [], allDone)
  }

  self.getMasternodeStatus = (allDone) => {
    self._request('masternode', ['status'], allDone)
  }

  self.getMasternodeList = (allDone) => {
    self._request('masternode', ['list', 'full'], allDone)
  }

  self.masternodeOutputs = (allDone) => {
    self._request('masternode', ['outputs'], allDone)
  }

  self.genKey = (allDone) => {
    self._request('masternode', ['genkey'], allDone)
  }
  self.masternodeStartMany = (allDone) => {
    self._request('masternode', ['start-many'], allDone)
  }

  self.createMasternode = (arg, allDone) => {
    let mnConfig = self.getMasternodeConfigSync()
    let confString = `\n${arg.alias} ${arg.ipAddress}:${arg.port} ${arg.privateKey} ${arg.masternodeOutputs} ${arg.masternodeOutputIndex}`
    let writeLines = mnConfig.split('\n')
    let dupeLine = false

    writeLines.forEach((line) => {
      if (line.trim() === confString.trim()) dupeLine = true
    })

    if (!dupeLine) mnConfig += confString

    fs.writeFile(`${self.datadir}${self.pathSep}masternode.conf`, mnConfig, (err) => {
      allDone(err, true)
    })
  }

  self.getMasternodeConfigSync = () => {
    let mnConfigFile = `${self.datadir}${self.pathSep}masternode.conf`
    try {
      fs.statSync(mnConfigFile)
    } catch (err) {
      // file doesn't exist so create it
      fs.writeFileSync(`${self.datadir}${self.pathSep}masternode.conf`, '')
    }

    return fs.readFileSync(mnConfigFile, 'utf8')
  }

  self.listUnspent = function (allDone) {
    self._request('listunspent', [1], allDone)
  }

  self.getMNUTXOSync = (unspent) => {
    let mnConfig = self.getMasternodeConfigSync().split('\n').map((conf) => {
      conf = conf.split(' ')
      return conf[3]
    })

    let utxo = unspent.filter((output) => {
      return mnConfig.indexOf(output.txid) > -1
    })

    return utxo.length > 0 ? utxo : false
  }

  self.getNonMNUTXOSync = (unspent) => {
    let mnConfig = self.getMasternodeConfigSync().split('\n').map((conf) => {
      conf = conf.split(' ')
      return conf[3]
    })

    let utxo = unspent.filter((output) => {
      return mnConfig.indexOf(output.txid) === -1 && output.spendable === true
    })

    return utxo.length > 0 ? utxo : false
  }

  self.sendProtectMNCollateral = (arg, allDone) => {
    self.listUnspent((err, res) => {
      // try to find their MN collateral output
      let mnUTXO = self.getMNUTXOSync(res)
      // can't find one so we can just use the normal sendToAddress
      if (!mnUTXO) {
        self.sendToAddress(arg, allDone)
        // found the MN collateral so we need to craft a transaction that ignores it
      } else {
        let safeOutputs = self.getNonMNUTXOSync(res)
        let errorMessage = JSON.stringify({
          error: {
            message: 'No suitable coins to send.  Please wait for recently sent transactions to get at least 1 confirmation.'
          }
        })

        if (!safeOutputs.length) return allDone({message: errorMessage}, {})

        self.sendRawTransaction(safeOutputs, arg, allDone)
      }
    })
  }

  self.sendRawTransaction = (outputs, toObj, allDone) => {
    let sendTo = {}
    let outputTotal = 0
    let useOutputs = []
    let minerFee = 0.0001
    sendTo[toObj.address] = toObj.amount
    // check to see if a single unspent output would cover the transaction
    let useSingle = _.find(outputs, (output) => output.amount >= toObj.amount && output.address !== toObj.address && !_.find(self.usedInputs, {txid: output.txid, vout: output.vout}))
    if (useSingle) {
      console.log('USE SINGLE', useSingle)
      useOutputs.push(useSingle)
    } else {
      // if not, loop over the unspent until we sum up enough to send
      for (let o = 0; o < outputs.length; o++) {
        // check to make sure this output hasn't been used already and that the address of the output doesn't match the address of the receiver
        if (!_.find(self.usedInputs, {txid: outputs[o].txid, vout: outputs[o].vout}) && outputs[0].address !== toObj.address) {
          useOutputs.push({txid: outputs[o].txid, vout: outputs[o].vout})
          outputTotal += outputs[o].amount
          if (outputTotal >= toObj.amount + minerFee) break
        }
      }
    }

    if (!useOutputs.length) {
      let errorMessage = JSON.stringify({
        error: {
          message: `Unable send coins from an address to the same address.`
        }
      })
      return allDone({message: errorMessage}, {})
    }

    async.waterfall([
      (next) => {
        // if there is no change, move on
        if (outputTotal === toObj.amount + minerFee) return next(null, false)
        self.getNewAddress((err, address) => {
          if (err) return next(err)
          // calculate how much change to send but leave some for a miner fee
          sendTo[address] = outputTotal - toObj.amount - minerFee
          next()
        })
      },
      (next) => {
        self._request('createrawtransaction', [useOutputs, sendTo], next)
      },
      (rawtx, next) => {
        self._request('signrawtransaction', [rawtx], next)
      },
      (signedtx, next) => {
        self._request('sendrawtransaction', [signedtx.hex], next)
      }
    ], (err, res) => {
      if (err) console.log(err)
      if (!err) self.usedInputs = _.concat(self.usedInputs, useOutputs)
      console.log('USED', self.usedInputs)
      // we don't want the array of spent inputs to grow forever so we'll limit it to 50.
      // Chances are by the time they get 50 in there some will have been confirmed and consumed anyway
      if (self.usedInputs.length > 50) self.usedInputs.slice(0, 50)
      allDone(err, res)
    })
  }

  self.unlock = (arg, allDone) => {
    // hard code wallet unlock to 10 seconds
    let unlockTime = arg.forSend ? 5 : 99999999
    self._request('walletpassphrase', [`"${arg.password.toString().trim()}"`, unlockTime, false], (err, res) => {
      if (!err) return allDone(err, res)
      self._runCLI(`walletpassphrase "${arg.password.toString().trim()}" ${unlockTime} false`, (cliError, cliRes) => {
        if (cliError) return allDone(err, res)
        allDone(cliError, cliRes)
      })
    })
  }

  self.enableStaking = (arg, allDone) => {
    // hard code wallet unlock to 10 seconds
    self._request('walletpassphrase', [`"${arg.password.toString().trim()}"`, 99999999, true], (err, res) => {
      if (!err) return allDone(err, res)
      self._runCLI(`walletpassphrase "${arg.password.toString().trim()}" 99999999 true`, (cliError, cliRes) => {
        if (cliError) return allDone(err, res)
        allDone(cliError, cliRes)
      })
    })
  }

  self.lock = (allDone) => {
    // hard code wallet unlock to 10 seconds
    self._request('walletpassphrase', [`" "`, 0, false], (err, res) => {
      if (!err) return allDone(err, res)
      self._runCLI(`walletpassphrase "" 0 false`, (cliError, cliRes) => {
        if (cliError) return allDone(err, res)
        allDone(cliError, cliRes)
      })
    })
  }

  self.encrypt = (arg, allDone) => {
    // hard code wallet unlock to 10 seconds
    self._request('encryptwallet', [`"${arg.password.toString().trim()}"`], allDone)
  }

  self.stop = (allDone) => {
    self._request('stop', [], allDone)
  }

  self.runCommand = (command, allDone) => {
    let args = command.split(' ')
    command = args.shift()

    // the stupid RPC won't cast this to INT
    if (command === 'walletpassphrase') args[1] = parseInt(args[1])

    self._request(command, args, (err, res) => {
      if (err) err = err.message
      allDone(err, res, err)
    })
  }

  self._runCLI = (command, allDone) => {
    exec(`"${self.datadir}/${self.daemonFile}" ${self.argString} ${command}`, (error, stdout, stderr) => {
      try {
        stdout = JSON.parse(stdout)
      } catch (err) {
        // the return isn't JSON so we can't parse it
      }
      allDone(error || stderr, stdout)
    })
  }
}
