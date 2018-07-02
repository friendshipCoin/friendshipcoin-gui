import { modal } from 'vue-strap'

export default {
  name: 'Send',
  components: {
    modal
  },
  data () {
    return {
      address: '',
      amount: '',
      addToAddressBook: false,
      receiverName: '',
      addressBook: [],
      success: false,
      error: false,
      isUnlockWalletWindowOpen: false,
      password: '',
      protectMNCollat: false,
      mightHaveMN: false,
      balance: 0
    }
  },
  mounted () {
    this.addressBook = this.$electron.ipcRenderer.sendSync('GET_ADDRESS_BOOK')
    if (this.$route.query.to) this.address = this.$route.query.to
    this.balance = this.$electron.ipcRenderer.sendSync('GET_BALANCE')
    if (this.balance >= 14466) {
      this.protectMNCollat = true
      this.mightHaveMN = true
    }
  },
  methods: {
    onUnlockWallet () {
      const result = this.$electron.ipcRenderer.sendSync('UNLOCK_WALLET', { password: this.password, forSend: true })
      this.isUnlockWalletWindowOpen = false
      if (result.err) {
        let parsed = JSON.parse(result.err.message)
        this.error = parsed.error.message
      } else {
        this.onSend()
      }
    },
    onShowWalletUnlock () {
      this.password = ''
      this.error = false
      this.success = false
      this.isUnlockWalletWindowOpen = true
    },
    onSend () {
      if (this.address === '') {
        this.error = 'Please enter the receving address.'
        return
      }
      const amount = parseFloat(this.amount)
      if (!amount || amount <= 0) {
        this.error = 'Please input a valid amount.'
        return
      }
      if (this.addToAddressBook && !this.receiverName) {
        this.error = `Please input the receiver's name.`
        return
      }
      const result = this.$electron.ipcRenderer.sendSync('SEND_TO_ADDRESS', {
        address: this.address,
        amount
      })
      if (result.err) {
        this.success = false

        console.log(result.err)
        let parsed = JSON.parse(result.err.message)
        console.log(parsed)
        this.error = parsed.error.message

        if (parsed.error.code === -13) {
          this.onShowWalletUnlock()
        }
      } else {
        let index = this.addressBook.findIndex(address => address.address === this.address)
        let receiver = this.address
        if (this.addToAddressBook && index === -1) {
          this.addressBook.push({
            name: this.receiverName,
            address: this.address
          })
          this.$electron.ipcRenderer.sendSync('UPDATE_ADDRESS_BOOK', this.addressBook)
        }
        index = this.addressBook.findIndex(address => address.address === this.address)
        if (index >= 0) {
          receiver = this.addressBook[index].name
        }

        this.success = `${this.amount} FSC has been successfully sent to ${receiver}`
        this.error = false
        this.address = ''
        this.amount = ''
        this.balance -= amount
        this.balance = this.balance.toFixed(8)
      }
    }
  }
}
