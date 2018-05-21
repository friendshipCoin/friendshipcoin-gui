import moment from 'moment'

export default {
  name: 'Dashboard',
  data () {
    return {
      storeBlockHeight: -1,
      transactionRows: [],
      balances: {
        available: 0,
        stake: 0
      },
      staking: {
        enabled: false,
        staking: false,
        expectedtime: -1
      },
      myMasternodes: 'newp'
    }
  },
  created () {
    // Get Wallet Balance
    this.getWalletBalance()
    // Get Transaction History
    this.getTransactionHistory()
    // Get staking Info
    this.getStakingInfo()
    this.storeBlockHeight = this.$store.state.myBlockHeight
    this.myMasternodes = JSON.stringify(this.$store.state.myMasternodes)
  },
  methods: {
    getWalletBalance () {
      const walletInfo = this.$electron.ipcRenderer.sendSync('GET_INFO')
      this.balances.available = walletInfo.balance
      this.balances.stake = walletInfo.stake
      setTimeout(this.getTransactionHistory, 3000)
    },
    getTransactionHistory () {
      const transactionRows = this.$electron.ipcRenderer.sendSync('LIST_TRANSACTIONS')
      if (!transactionRows.length) return true

      transactionRows.splice(0, transactionRows.length - 10)
      transactionRows.reverse()
      this.transactionRows = transactionRows.map(transaction => ({
        date: moment(transaction.time, 'X').format('YYYY-MM-DD hh:mm:ss'),
        type: transaction.category.toUpperCase(),
        amount: transaction.amount
      }))
      setTimeout(this.getTransactionHistory, 3000)
    },
    getStakingInfo () {
      setTimeout(this.getStakingInfo, 3000)
      const stakingInfo = this.$electron.ipcRenderer.sendSync('GET_STAKING_INFO')
      this.staking.enabled = stakingInfo.enabled ? 'YES' : 'NO'
      this.staking.staking = stakingInfo.staking ? 'YES' : 'NO'
      this.staking.expectedtime = 'N/A'

      if (stakingInfo.staking) {
        stakingInfo.expectedtime = parseInt(stakingInfo.expectedtime)

        let duration = stakingInfo.expectedtime / 60 / 60 // hours
        if (duration >= 1) {
          this.staking.expectedtime = `${duration.toFixed(2)} Hour`
          if (duration > 1) this.staking.expectedtime += 's'
          return true
        }

        duration = stakingInfo.expectedtime / 60
        this.staking.expectedtime = `${duration.toFixed(2)} Minute`
        if (duration > 1) this.staking.expectedtime += 's'
      }
    }
  }
}
