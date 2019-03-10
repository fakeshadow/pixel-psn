import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Store from './views/Store.vue'
import People from './views/People.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/store',
      name: 'store',
      component: Store
    },
    {
      path: '/people',
      name: 'people',
      component: People
    }
  ]
})
