import Vue from 'vue'
import Router from 'vue-router'

import DashboardLayout from '@/components/layouts/Dashboard/Dashboard.vue'
import Dashboard from '@/components/pages/Dashboard/Dashboard.vue'
import AddressBook from '@/components/pages/AddressBook/AddressBook.vue'
import Send from '@/components/pages/Send/Send.vue'
import Receive from '@/components/pages/Receive/Receive.vue'
import Transactions from '@/components/pages/Transactions/Transactions.vue'
import Masternodes from '@/components/pages/Masternodes/Masternodes.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: DashboardLayout,
      children: [
        {
          path: '',
          redirect: 'dashboard'
        },
        {
          path: 'dashboard',
          component: Dashboard
        },
        {
          path: 'address-book',
          component: AddressBook
        },
        {
          path: 'send',
          component: Send
        },
        {
          path: 'receive',
          component: Receive
        },
        {
          path: 'transactions',
          component: Transactions
        },
        {
          path: 'masternodes',
          component: Masternodes
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
