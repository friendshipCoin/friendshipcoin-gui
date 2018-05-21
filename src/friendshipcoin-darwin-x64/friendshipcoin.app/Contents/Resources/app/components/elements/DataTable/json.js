import objectPath from "object-path";

export default {
	data: () => ({
		paginate: false,
		filterable: false,
		sortable: false,
		canResize: true,
		filter: "",
		sortBy: "",
		sortDir: "asc",
		page: 1,
		pageSize: 5,
		data: [],
		table: null,
	}),
	computed: {
		lastPage() {
			return Math.ceil(this.filteredRows.length / this.pageSize);
		},
		filteredRows() {
			const rows = this.data;
			if (this.filterable && this.filter) {
				const filterWords = this.filter.split(" ");
				return rows.filter((row) => {
					let pass = false;
					filterWords.forEach((pFilterWord) => {
						let filterWord = pFilterWord;
						if (typeof filterWord.toLowerCase === "function") {
							filterWord = filterWord.toLowerCase();
						}
						this.table.columns.forEach((columnDefinition) => {
							let columnText = "";
							if (!columnDefinition.filterable) {
								return;
							}
							if (columnDefinition.field) {
								columnText = objectPath.get(row, columnDefinition.field);
							} else if (typeof columnDefinition.callback === "function") {
								columnText = (columnDefinition.callback)(row);
							} else {
								return;
							}
							if (!columnText) {
								return;
							}
							columnText = `${columnText}`.trim();
							if (typeof columnText.toLowerCase === "function") {
								columnText = columnText.toLowerCase();
							}
							if (columnText.indexOf(filterWord) !== -1) {
								pass = true;
							}
						});
					});
					return pass;
				}, this);
			}

			return rows.filter(() => true);
		},
		sortedRows() {
			const column = this.table.columnProps[this.sortBy];

			if (!column || this.sortBy === null) {
				return this.filteredRows;
			}

			return this.filteredRows.sort((a, b) => {
				const valueA = column.callback ? column.callback(a) : objectPath.get(a, column.field);
				const valueB = column.callback ? column.callback(b) : objectPath.get(b, column.field);

				if (valueA === valueB) {
					return 0;
				}

				let sortVal = valueA > valueB ? 1 : -1;

				if (this.sortDir === "dsc") {
					sortVal *= -1;
				}

				return sortVal;
			}, this);
		},
		visibleRows() {
			if (this.paginate) {
				const beginning = this.pageSize * (this.page - 1);
				return this.sortedRows.slice(beginning, beginning + this.pageSize);
			}

			return this.sortedRows;
		},
	},
	methods: {
		sortByField(columnId) {
			if (this.sortBy === columnId) {
				switch (this.sortDir) {
				case null:
					this.sortDir = "asc";
					break;
				case "asc":
					this.sortDir = "dsc";
					break;
				case "dsc":
					this.sortDir = null;
					break;
				default:
					break;
				}

				return;
			}

			this.sortBy = columnId;
			this.sortDir = "asc";
		},
		setPage(pageNumber, event) {
			this.page = pageNumber;
			event.target.blur();
		},
		setTable(table) {
			this.table = table;
		},
		setData(data) {
			this.data = data;
		},
		setFilterable(value) {
			this.filterable = value;
		},
		setPaginate(value) {
			this.paginate = value;
		},
		setSortable(value) {
			this.sortable = value;
		},
	},
	watch: {
		filter() {
			this.page = 1;
		},
		pageSize() {
			this.page = 1;
		},
	},
};
