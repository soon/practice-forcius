import Vue from 'vue';
import App from './App.vue';
import {store} from './store';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faBolt);

Vue.component('fa', FontAwesomeIcon);

new Vue({
  store,
  el: '#app',
  render: h => h(App),
});
