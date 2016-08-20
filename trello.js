var authenticationSuccess = function() { console.log("Successful authentication"); };
var authenticationFailure = function() { console.log("Failed authentication"); };



var t = new Vue({
    el: "#trello",

    data: {
        authenticated: false,
        boards: null,
        selectedBoard: null,
        lists: null,
        selectedList: null,
        cards: null
    },

    watch: {
        selectedBoard: function(val, oldVal) {
            var vm = this;
            if (0 < val.length) {
                Trello.get('/boards/' + val +'/lists').then(function(data) {
                    vm.lists = data;
                })
            }
        },
        selectedList: function(val, oldVal) {
            var vm = this;
            if (0 < val.length) {
                Trello.get('/lists/' + val +'/cards').then(function(data) {
                    vm.cards = data;
                })
            }
        }
    },

    methods: {
        authorize: function() {
            Trello.authorize({
              type: 'popup',
              name: 'Ticket Dependancy Graph',
              scope: {
                read: 'true',
                write: 'true' },
              expiration: '1hour',
              success: this.authSuccessHandler,
              error: function() {
                  console.warn("Failed authentication")
              }
            });
        },

        authSuccessHandler: function() {
            var vm = this;
            console.log("Successful authentication")
            this.authenticated = true;
            Trello.get('/member/me/boards').then(function(data) {
                vm.boards = data;
            })
        },

        populate: function() {
            for (i = 0; i < this.cards.length; i++) {
                var card = this.cards[i];
                console.log(card.idShort + " - " + card.name)
            }
        }
    }
})
