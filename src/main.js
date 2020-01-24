import Vue from 'vue';
import VueGtag from 'vue-gtag';

Vue.use(VueGtag, {
  config: { id: 'UA-121199171-2' },
});

require('./trelloHandler.js');
require('./graphHandler.js');
