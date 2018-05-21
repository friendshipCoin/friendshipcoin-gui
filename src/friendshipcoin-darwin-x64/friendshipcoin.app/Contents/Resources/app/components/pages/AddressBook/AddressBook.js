import _ from "lodash";
import DataTable from "@/components/elements/DataTable/DataTable.vue";

export default {
	name: "AddressBook",
	components: {
		DataTable,
	},
	data() {
		return {
			addressBookColumns: [],
			addressBookRows: [],
		};
	},
	created() {
		// Init Table Format
		this.setTableFormat();
		// Get Receive Address List
		this.getAddressBook();
		this.$on("onSelectRow", (row) => {
			this.$router.replace({ path: `/send?to=${row.address}` });
		});
	},
	methods: {
		setTableFormat() {
			this.addressBookColumns = [
				{ label: "Name", field: "name", filterable: true, align: "center" },
				{ label: "Address", field: "address", filterable: true, align: "center" },
			];
		},
		getAddressBook() {
			this.addressBookRows = this.$electron.ipcRenderer.sendSync("GET_ADDRESS_BOOK");
		},
	},
};
