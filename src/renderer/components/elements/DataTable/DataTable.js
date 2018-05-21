import Vue from 'vue'
import objectPath from 'object-path'
import jsonStore from './json'

export default {
  props: {
    columns: [Object, Array],
    data: [Object, Array, String],
    initSortField: {
      type: Number,
      default: -1
    },
    filterable: {
      type: Boolean,
      default: false
    },
    paginate: {
      type: Boolean,
      default: false
    },
    sizeOptions: {
      type: [Object, Array],
      default: () => [5, 10, 25, 50, 100]
    },
    dataStore: {
      type: Object,
      default: null
    }
  },
  data: () => ({
    store: null
  }),
  created () {
    this.updateStore(this.data)
  },
  computed: {
    columnProps () {
      return this.columns.map((column, index) => {
        let sortable = typeof column.sortable === 'undefined' ? true : column.sortable
        sortable = column.component ? false : sortable
        let filterable = typeof column.filterable === 'undefined' ? true : column.filterable
        filterable = column.component ? false : filterable

        return {
          id: index,
          label: column.label || '',
          align: column.align || 'left',
          sortable,
          filterable,
          field: column.field || null,
          callback: column.callback || null,
          component: column.component || null
        }
      })
    },
    hasSizeOptions () {
      const isArray = (this.sizeOptions instanceof Array)
      const canResize = this.store.canResize
      return isArray && canResize
    }
  },
  methods: {
    getHeaderColumnClass (headColumn) {
      const canSort = this.store.sortable
      const sortNone = headColumn.id !== this.store.sortBy || !this.store.sortDir
      const sortAsc = headColumn.id === this.store.sortBy && this.store.sortDir === 'asc'
      const sortDsc = headColumn.id === this.store.sortBy && this.store.sortDir === 'dsc'

      return {
        fa: canSort,
        // 'fa-sort': canSort,
        'fa-sort': canSort && sortNone,
        'fa fa-sort-asc': canSort && sortAsc,
        'fa fa-sort-desc': canSort && sortDsc
      }
    },
    updateStore (data) {
      if (this.dataStore) {
        this.store = new Vue(this.dataStore)
      } else {
        this.store = new Vue(jsonStore)
      }
      this.store.setTable(this)
      this.store.setData(data)
      this.store.setFilterable(this.filterable)
      this.store.setPaginate(this.paginate)
      this.store.setSortable(true)
    },
    getRowFromField (row, field) {
      return objectPath.get(row, field)
    },
    getStateString () {
      const pageSize = this.store.pageSize
      let startEntry = ((this.store.page - 1) * pageSize) + 1
      let endEntry = this.store.page * pageSize
      const totalEntry = this.store.filteredRows.length
      if (this.store.page === Math.ceil(totalEntry / pageSize)) {
        endEntry = startEntry + ((totalEntry % pageSize) - 1)
      }
      if (totalEntry === 0) {
        startEntry = 0
        endEntry = 0
      }
      return `Showing ${startEntry} to ${endEntry} of ${totalEntry} entries`
    },
    onSelectRow (row) {
      this.$parent.$emit('onSelectRow', row)
    }
  },
  watch: {
    data () {
      this.updateStore(this.data)
      if (this.initSortField !== -1) {
        this.store.sortByField(this.initSortField)
        this.store.sortByField(this.initSortField)
      }
    }
  }
}
