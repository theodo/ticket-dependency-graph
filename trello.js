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

        addOrUpdateCards: function() {
            for (var i = 0; i < this.cards.length; i++) {
                var card = this.cards[i];
                main.addOrUpdateTicket(card.idShort, card.name)
                console.log(card.idShort + " - " + card.name)
            }
        },

        deleteUselessCards: function() {
            var nodes = main.getNodes();
            var toBeRemoved = [];
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i]
                if (!this.isTicketIdInList(node.key)) {
                    toBeRemoved.push(node.key)
                }
            }
            for (var i = 0; i < toBeRemoved.length; i++) {
                main.removeTicket(toBeRemoved[i])
            }
        },

        isTicketIdInList: function(ticketId) {
            for (var i = 0; i < this.cards.length; i++) {
                if (this.cards[i].idShort == ticketId) {
                    return true;
                }
            }
            return false;
        }
    }
})
