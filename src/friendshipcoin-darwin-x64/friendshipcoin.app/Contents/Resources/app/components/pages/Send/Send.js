export default {
	name: "Send",
	data() {
		return {
			address: "",
			amount: "",
			addToAddressBook: false,
			receiverName: "",
			addressBook: [],
			success: false,
			error: false,
		};
	},
	mounted() {
		this.addressBook = this.$electron.ipcRenderer.sendSync("GET_ADDRESS_BOOK");
		this.address = this.$route.query.to || "";
	},
	methods: {
		onSend() {
			if (this.address === "") {
				this.error = "Please enter the receving address.";
				return;
			}
			const amount = parseFloat(this.amount);
			if (!amount || amount <= 0) {
				this.error = "Please input the valid amount.";
				return;
			}
			if (this.addToAddressBook && !this.receiverName) {
				this.error = "Please input the receiver's name.";
				return;
			}
			const result = this.$electron.ipcRenderer.sendSync("SEND_TO_ADDRESS", {
				address: this.address,
				amount,
			});
			if (result.err) {
				this.success = false;
				this.error = result.err.message;
			} else {
				let index = this.addressBook.findIndex(address => address.address === this.address);
				let receiver = this.address;
				if (this.addToAddressBook && index === -1) {
					this.addressBook.push({
						name: this.receiverName,
						address: this.address,
					});
					this.$electron.ipcRenderer.sendSync("UPDATE_ADDRESS_BOOK", this.addressBook);
				}
				index = this.addressBook.findIndex(address => address.address === this.address);
				if (index >= 0) {
					receiver = this.addressBook[index].name;
				}

				this.success = `${this.amount} FSC has been successfully sent to ${receiver}`;
				this.error = false;
				this.address = "";
				this.amount = "";
			}
		},
	},
};
