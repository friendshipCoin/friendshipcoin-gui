import moment from "moment";

export default {
	name: "Dashboard",
	data() {
		return {
			transactionRows: [],
			balances: {
				total: 0,
			},
		};
	},
	created() {
		// Get Wallet Balance
		this.getWalletBalance();
		// Get Transaction History
		this.getTransactionHistory();
	},
	methods: {
		getWalletBalance() {
			this.balances.total = this.$electron.ipcRenderer.sendSync("GET_BALANCE");
		},
		getTransactionHistory() {
			const transactionRows = this.$electron.ipcRenderer.sendSync("LIST_TRANSACTIONS");
			transactionRows.splice(0, transactionRows.length - 10);
			transactionRows.reverse();
			this.transactionRows = transactionRows.map(transaction => ({
				date: moment(transaction.time, "X").format("YYYY-MM-DD hh:mm:ss"),
				type: transaction.category.toUpperCase(),
				amount: transaction.amount,
			}));
			setTimeout(this.getTransactionHistory, 3000);
		},
	},
};
