const Vue = require('vue');
const VueAnalytics = require('vue-analytics').default;

require('./trelloHandler.js');
require('./graphHandler.js');

Vue.use(VueAnalytics, {
  id: 'UA-121199171-2', // ask access to ivanp@theodo.fr
});
