var Vue = require('vue');
require('./trelloApiHelper.js');
require('./graphHandler.js')

var trelloHandler = new Vue({
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
                vm.refresh()
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
                write: 'false' },
              expiration: 'never',
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

        refresh: function() {
            var vm = this;
            Trello.get('/lists/' + this.selectedList +'/cards').then(function(data) {
                vm.cards = data;
                vm.deleteUselessCards();
                vm.addOrUpdateCards();
            })
        },

        addOrUpdateCards: function() {
            for (var i = 0; i < this.cards.length; i++) {
                var card = this.cards[i];
                window.graphHandler.addOrUpdateTicket(card.idShort, card.name)
            }
        },

        deleteUselessCards: function() {
            var nodes = window.graphHandler.getNodes();
            var toBeRemoved = [];
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i]
                if (!this.isTicketIdInList(node.key)) {
                    toBeRemoved.push(node.key)
                }
            }
            for (var i = 0; i < toBeRemoved.length; i++) {
                window.graphHandler.removeTicket(toBeRemoved[i])
            }
        },

        isTicketIdInList: function(ticketId) {
            for (var i = 0; i < this.cards.length; i++) {
                if (this.cards[i].idShort == ticketId) {
                    return true;
                }
            }
            return false;
        },

        saveData: function() {
            window.graphHandler.saveData()
        }
    }
})
