import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import VueTimeAgo from 'vue-timeago'

Vue.config.productionTip = false

Vue.use(VueTimeAgo, {
  name: 'Timeago', 
  locale: 'en', 
  locales: {
    'zh-CN': require('date-fns/locale/zh_cn'),
    'ja': require('date-fns/locale/ja'),
  }
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
