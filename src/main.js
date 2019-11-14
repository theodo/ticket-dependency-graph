const Vue = require('vue');
const VueAnalytics = require('vue-analytics').default;

require('./trelloHandler.js');
require('./graphHandler.js');

Vue.use(VueAnalytics, {
  id: 'UA-121199171-2', // ask access to ivanp@theodo.fr. Google analytics is not working at the moment, will be fixed https://trello.com/c/gSyGL6B8
});
