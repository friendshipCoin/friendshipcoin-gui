import { modal } from 'vue-strap'
import DataTable from '@/components/elements/DataTable/DataTable.vue'

export default {
  name: 'Receive',
  components: {
    modal,
    DataTable
  },
  data () {
    return {
      receiveAddressColumns: [],
      receiveAddressRows: [],
      label: '',
      showCreateModal: false,
      status: false,
      error: '',
      success: ''
    }
  },
  created () {
    // Init Table Format
    this.setTableFormat()
    // Get Receive Address List
    this.getReceiveAddressList()
  },
  methods: {
    setTableFormat () {
      this.receiveAddressColumns = [
        { label: 'Label', field: 'label', filterable: true, align: 'center' },
        { label: 'Receive Address', field: 'address', filterable: true, align: 'center' }
      ]
    },
    getReceiveAddressList () {
      this.receiveAddressRows = this.$electron.ipcRenderer.sendSync('GET_RECEIVING_ADDRESS_LIST')
    },
    onCreateAddress () {
      if (!this.label) {
        this.error = 'Please input label for new receive address!'
        return
      }
      if (this.receiveAddressRows.findIndex(row => row.label === this.label) !== -1) {
        this.error = 'This label has been already used.'
        return
      }
      const newAddress = this.$electron.ipcRenderer.sendSync('GET_NEW_ADDRESS', {label: this.label})
      this.receiveAddressRows.push({
        label: this.label,
        address: newAddress
      })
      this.success = `New address created: ${newAddress}`

      this.$electron.ipcRenderer.sendSync('UPDATE_RECEIVING_ADDRESS_LIST', this.receiveAddressRows)
      this.getReceiveAddressList()
      this.showCreateModal = false
    }
  }
}
