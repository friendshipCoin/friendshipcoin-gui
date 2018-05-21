const os = require('os')
const mydir = `${os.homedir()}/.friendshipcoin`
const async = require('async')

module.exports = function () {
  const self = this
  self.app = {
    mydir: mydir
  }

  self.init = function (main, allDone) {
    let modules = ['eventHandlers', 'menu', 'util', 'wallet', 'window']

    modules.forEach((pMod) => {
      let mod = pMod
      const Tmp = require(`./${mod}`)
      mod = mod.replace(/\//g, '_')
      self.app[mod] = new Tmp(main)
    })

    async.each(modules, (pMod, done) => {
      const mod = pMod.replace(/\//g, '_')
      if (typeof self.app[mod].init === 'function') {
        self.app[mod].init(this.app, done)
      } else {
        done()
      }
    }, (err) => {
      if (err) return allDone(err, false)
      async.each(modules, (pMod, done) => {
        const mod = pMod.replace(/\//g, '_')
        if (typeof self.app[mod].start === 'function') {
          self.app[mod].start(this.app, done)
        } else {
          done()
        }
      }, (err) => {
        allDone(err, self.app)
      })
    })
  }
}
