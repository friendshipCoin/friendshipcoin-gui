import Vue from "vue";
import axios from "axios";

import App from "./App";
import router from "./router";
import store from "./store";

const VueElectron = window.require("vue-electron");

if (!process.env.IS_WEB) {
	Vue.use(VueElectron);
}
Vue.prototype.$http = axios;
Vue.http = axios;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
	components: { App },
	router,
	store,
	template: "<App/>",
}).$mount("#app");
