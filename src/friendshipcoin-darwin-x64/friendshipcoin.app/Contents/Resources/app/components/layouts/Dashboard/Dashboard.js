import Preloader from "@/components/elements/Preloader/Preloader.vue";
import Sidebar from "@/components/elements/Sidebar/Sidebar.vue";

export default {
	name: "DashboardLayout",
	components: {
		Preloader,
		Sidebar,
	},
	data () {
		return {
			isLoading: false,
		};
	},
	created () {
		const checkWalletLoaded = () => {
			this.isLoading = !this.$electron.ipcRenderer.sendSync("CHECK_WALLET_LOADED");
			if (this.isLoading) {
				setTimeout(checkWalletLoaded, 1000);
			}
		};
		checkWalletLoaded();
	}
};
