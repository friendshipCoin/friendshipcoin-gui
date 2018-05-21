import moment from 'moment'
import DataTable from '@/components/elements/DataTable/DataTable.vue'

export default {
  name: 'Transactions',
  components: {
    dataTable: DataTable
  },
  data () {
    return {
      transactionColumns: [],
      transactionRows: []
    }
  },
  created () {
    // Init Table Format
    this.setTableFormat()
    // Get Transaction History
    this.getTransactionHistory()
  },
  methods: {
    setTableFormat () {
      this.transactionColumns = [
        { label: 'Date', field: 'date', filterable: true, align: 'center' },
        { label: 'Type', field: 'type', filterable: true, align: 'center' },
        { label: 'Amount', field: 'amount', filterable: true, align: 'center' },
        { label: 'Confirmations', field: 'confirmations', filterable: true, align: 'center' }
      ]
    },
    getTransactionHistory () {
      const transactionRows = this.$electron.ipcRenderer.sendSync('LIST_TRANSACTIONS').map(transaction => ({
        ...transaction,
        date: moment(transaction.time, 'X').format('YYYY-MM-DD hh:mm:ss'),
        type: transaction.category.toUpperCase()
      }))
      transactionRows.reverse()
      this.transactionRows = transactionRows

      setTimeout(this.getTransactionHistory, 3000)
    }
  }
}
