import DataTable from '@/components/elements/DataTable/DataTable.vue'
import moment from 'moment'
import { modal } from 'vue-strap'

export default {
  name: 'Masternodes',
  components: {
    DataTable,
    modal
  },
  data () {
    return {
      masternodesColumns: [],
      masternodesNetworkColumns: [],
      masternodesRows: [],
      activeTab: 'myMasternodes',
      myMasternodesActive: true,
      networkMasternodesActive: false,
      showCreateModal: false,
      status: false,
      error: '',
      created: '',
      success: '',
      startError: '',
      startSuccess: '',
      mnData: {
        alias: '',
        ipAddress: '',
        port: 58008
      },
      hasCollateral: false,
      isUnlockWalletWindowOpen: false,
      unlockError: false,
      unlockSuccess: false,
      password: '',
      hasStarted: false
    }
  },
  created () {
    // Init Table Format
    this.setTableFormat()
    // Get Receive Address List
    this.getMasternodeStatus()
  },
  methods: {
    setTableFormat () {
      this.masternodesColumns = [
        { label: 'Alias', field: 'alias', filterable: true, align: 'center' },
        { label: 'Address', field: 'address', filterable: true, align: 'center' },
        { label: 'Status', field: 'status', filterable: true, align: 'center' },
        { label: 'Last Seen', field: 'lastSeen', filterable: true, align: 'center' },
        { label: 'Active', field: 'active', filterable: true, align: 'center' },
        { label: 'Pubkey', field: 'pubkey', filterable: true, align: 'center' }
      ]
      this.masternodesNetworkColumns = [
        { label: 'Address', field: 'address', filterable: true, align: 'center' },
        { label: 'Status', field: 'status', filterable: true, align: 'center' },
        { label: 'Last Seen', field: 'lastSeen', filterable: true, align: 'center' },
        { label: 'Active', field: 'active', filterable: true, align: 'center' },
        { label: 'Pubkey', field: 'pubkey', filterable: true, align: 'center' }
      ]
    },
    setTab (whichTab) {
      this.activeTab = whichTab
      if (whichTab === 'networkMasternodes') {
        this.getNetworkMasternodeStatus()
        this.networkMasternodesActive = true
        this.myMasternodesActive = false
      } else {
        this.getMasternodeStatus()
        this.networkMasternodesActive = false
        this.myMasternodesActive = true
      }
    },
    getMasternodeStatus () {
      this.getNetworkMasternodeStatus()
      let result = this.$electron.ipcRenderer.sendSync('GET_MASTERNODE_CONFIG')
      let mnConfig = result.data
      if (!mnConfig) return false

      mnConfig = mnConfig.split('\n')
      if (!mnConfig.length) return false

      let masterNodes = mnConfig.filter((node) => {
        return node.trim() !== ''
      })

      this.masternodesRows = []
      masterNodes.forEach((mn) => {
        let foundMNOnNetwork = false
        mn = mn.split(' ')
        for (let n = 0; n < this.masternodesNetworkRows.length; n++) {
          // console.log(`compare ${mn[1]} and ${this.masternodesNetworkRows[n].address}`)
          if (mn[1] === this.masternodesNetworkRows[n].address) {
            let useMe = {
              ...this.masternodesNetworkRows[n],
              alias: mn[0]
            }
            this.masternodesRows.push(useMe)
            foundMNOnNetwork = true
            break
          }
        }

        if (!foundMNOnNetwork) {
          let entry = {
            address: mn[1],
            active: 'Unknown',
            status: 'Unknown',
            alias: mn[0]
          }
          this.masternodesRows.push(entry)
        }
      })

      this.$store.commit('setMyMasternodes', this.masternodesRows)

      setTimeout(this.getMasternodeStatus, 10000)
    },
    getNetworkMasternodeStatus () {
      // status, protocol, pubkey, ip:port, lastseen, activeseconds,lastpaid
      let res = this.$electron.ipcRenderer.sendSync('NETWORK_MASTERNODES')
      let rows = []
      if (res.data) {
        for (let r in res.data) {
          let row = res.data[r].trim().split(' ')
          let lastSeen = moment(row[4] * 1000).format('MMMM Do YYYY, h:mm:ss a')
          let onlineSeconds = parseInt(row[row.length - 2])
          let minutesActive = moment.duration(onlineSeconds, 'seconds')
          rows.push({address: row[3], status: row[0], lastSeen: lastSeen, active: minutesActive.humanize(), pubkey: row[2]})
        }
      }
      this.masternodesNetworkRows = rows
    },
    onCreateMasternode () {
      let res = this.$electron.ipcRenderer.sendSync('CHECK_MASTERNODE_OUTPUTS')
      let output = res.data
      this.success = ''
      this.error = ''
      this.created = ''
      this.mnData = {
        alias: '',
        ipAddress: '',
        port: 58008
      }

      console.log(Object.keys(output))
      console.log(output)
      let outputTX = Object.keys(output)[0]
      console.log(outputTX)
      if (Object.keys(output).length === 0) {
        let newAddressRes = this.$electron.ipcRenderer.sendSync('GET_NEW_ADDRESS')
        this.error = `No suitable collateral transaction found.  Send exactly 14466 FSC to ${newAddressRes} and wait for 1 confirmation then try again.`
        // they need an address to send the coins to
      } else {
        let pkRes = this.$electron.ipcRenderer.sendSync('GET_MASTERNODE_PRIVKEY')
        let pk = pkRes.data
        this.mnData.privateKey = pk
        this.mnData.masternodeOutputs = outputTX
        this.mnData.masternodeOutputIndex = output[outputTX]
        this.hasCollateral = true
      }
    },
    onExecuteCreate () {
      if (this.mnData.ipAddress === '') return this.error = 'You must specify the public IP of the server hosting the Masternode'
      if (isNaN(this.mnData.port)) this.mnData.port = 58008
      let mnCreated = this.$electron.ipcRenderer.sendSync('CREATE_MASTERNODE', this.mnData)
      if (mnCreated.error) return this.error = mnCreated.error
      this.created = 'Masternode Configuration created successfully!  Please restart the wallet to start the masternode.'
    },
    onStartMasternode () {
      this.startError = ''
      let result = this.$electron.ipcRenderer.sendSync('START_MASTERNODE')
      let error = ''
      try {
        error = JSON.parse(result.err.message)
      } catch (err) {
        // nothing to do
      }

      if (error) {
        console.log(error.error)
        if (error.error.message.trim() !== 'Your wallet is locked, passphrase is required') return this.startError = error.error.message
        // show the modal to unlock wallet
        return this.isUnlockWalletWindowOpen = true
      }

      this.startSuccess = result.data.overall
      this.hasStarted = true
      this.getMasternodeStatus()
    },
    onUnlockWallet () {
      this.success = false
      const result = this.$electron.ipcRenderer.sendSync('UNLOCK_WALLET', { password: this.password, forSend: true })
      this.isUnlockWalletWindowOpen = false
      console.log(result)

      if (result.err) {
        let parsed = JSON.parse(result.err.message)
        console.log(parsed)
        this.startError = parsed.error.message
      } else {
        this.onStartMasternode()
      }
    }
  }
}
