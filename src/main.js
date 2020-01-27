import Vue from 'vue';
import VueGtag from 'vue-gtag';

import './trelloHandler';
import './graphHandler';

Vue.use(VueGtag, {
  config: { id: 'UA-121199171-2' },
});
