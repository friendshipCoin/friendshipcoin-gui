import { modal } from 'vue-strap'
import moment from 'moment'
import Preloader from '@/components/elements/Preloader/Preloader.vue'
import Sidebar from '@/components/elements/Sidebar/Sidebar.vue'

export default {
  name: 'DashboardLayout',
  components: {
    modal,
    Preloader,
    Sidebar
  },
  data () {
    return {
      isLoading: false,
      isDebugWindowOpen: false,
      isUnlockWalletWindowOpen: false,
      isEncryptWalletWindowOpen: false,
      historyList: [],
      command: '',
      password: '',
      success: false,
      error: false,
      stakingOnly: false,
      encPass: '',
      encPass2: '',
      submitted: false,
      syncing: false,
      systemInfo: {},
      firstBlockTime: 1519855096 * 1000,
      lastBlockReceived: false,
      blocksBehind: 0,
      syncMessage: 'All caught up!',
      noConnections: true,
      alertTitle: '',
      alertBody: '',
      isAlertOpen: false

    }
  },
  created () {
    this.$electron.ipcRenderer.on('SHOW_ALERT', (event, title, body) => {
      console.log(title)
      console.log(body)
      console.log(event)
      this.alertTitle = title
      this.alertBody = body
      this.isAlertOpen = true
    })

    const getInfo = () => {
      const result = this.$electron.ipcRenderer.sendSync('GET_INFO', {})
      if (result) {
        this.systemInfo = result
        if (result.connections === 0) return setTimeout(getInfo, 2000)
        this.noConnections = false

        const lastBlock = this.$electron.ipcRenderer.sendSync('GET_LAST_BLOCK', {})

        this.lastBlockReceived = lastBlock.time * 1000

        let minutesSinceFirstBlock = moment().diff(this.firstBlockTime, 'minutes')
        let blocksSinceForever = minutesSinceFirstBlock / 2.04

        let timeSinceLastBlock = moment().diff(this.lastBlockReceived, 'minutes')
        if (timeSinceLastBlock < 10) {
          this.syncing = false
          return true
        }

        if (!isNaN(blocksSinceForever)) {
          this.blocksBehind = (blocksSinceForever - result.blocks).toFixed(0)

          // sometimes the calculation is off and we get a negative number
          if (this.blocksBehind <= 0) {
            this.syncing = false
            return true
          }

          // only show this if we actually have connections and are syncing
          if (result.connections > 0) {
            this.syncMessage = `Sychronizing with FriendshipCoin Network.  You are approximately ${this.blocksBehind} blocks behind. `
            this.syncing = true
          }
        }

        // this.updateStore(blocksSinceForever, (blocksSinceForever - this.blocksBehind))
        if (this.blocksBehind > 0) return setTimeout(getInfo, 2000)

        this.syncing = false
      }
    }

    const checkWalletLoaded = () => {
      this.isLoading = !this.$electron.ipcRenderer.sendSync('CHECK_WALLET_LOADED')
      if (this.isLoading) {
        setTimeout(checkWalletLoaded, 1000)
      } else {
        getInfo()
      }
    }
    checkWalletLoaded()

    this.$electron.ipcRenderer.on('OPEN_DEBUG_WINDOW', () => {
      this.isDebugWindowOpen = true
    })

    this.$electron.ipcRenderer.on('OPEN_UNLOCK_WINDOW', () => {
      this.isUnlockWalletWindowOpen = true
      this.success = false
      this.error = false
      this.password = ''
      this.stakingOnly = false
    })
    this.$electron.ipcRenderer.on('OPEN_ENCRYPT_WINDOW', () => {
      this.isEncryptWalletWindowOpen = true
      this.success = false
      this.error = false
      this.password = ''
      this.encPass = ''
      this.encPass2 = ''
    })
    this.historyList.push({
      date: moment().format('YYYY-MM-DD hh:mm:ss'),
      welcomeMessage: 'Welcome to FriendshipCoin RPC Console.'
    })
  },
  methods: {
    updateStore (blocksSinceForever, myBlockHeight) {
      // store.blocksSinceForever = blocksSinceForever
      // store.myBlockHeight = myBlockHeight
    },
    onRunCommand () {
      if (this.command === '') return
      const result = this.$electron.ipcRenderer.sendSync('RUN_COMMAND', { command: this.command })
      console.log(result)
      let error = result.stderr

      if (error && typeof error === 'string') {
        error = JSON.parse(error).error
        if (error.hasOwnProperty('message')) error = error.message
      }

      let message = JSON.stringify(result.stdout, null, 2).split('\n')

      this.historyList.push({
        date: moment().format('YYYY-MM-DD hh:mm:ss'),
        command: this.command,
        error,
        message
      })
      this.command = ''
      setTimeout(() => {
        this.$refs.historyPanel.scrollTop = this.$refs.historyPanel.scrollHeight
      })
    },
    onUnlockWallet () {
      this.error = false
      this.success = false
      const result = this.$electron.ipcRenderer.sendSync('UNLOCK_WALLET', { password: this.password, stakingOnly: this.stakingOnly })
      if (result.err) {
        let parsed = JSON.parse(result.err.message)
        this.error = parsed.error.message
      } else {
        this.success = this.stakingOnly ? 'Wallet Unlocked for Staking!' : 'Wallet Unlocked!'
      }
    },
    onEncryptWallet () {
      this.error = false
      this.success = false
      this.submitted = true

      if (this.encPass === '') {
        this.error = 'A blank password wouldn\'t be very secure would it?  Try again.'
        this.submitted = false
        return
      }

      if (this.encPass !== this.encPass2) {
        this.error = 'Your passwords do not match!'
        this.submitted = false
        return
      }

      const result = this.$electron.ipcRenderer.sendSync('ENCRYPT_WALLET', { password: this.encPass })
      if (result.err) {
        let parsed = JSON.parse(result.err.message)
        this.error = parsed.error.message
      } else {
        this.success = 'Wallet Encrypted!  You will need to restart the application to continue using your wallet.'
      }
    },
    onQuit () {
      this.$electron.ipcRenderer.sendSync('QUIT', {})
    }
  }
}
