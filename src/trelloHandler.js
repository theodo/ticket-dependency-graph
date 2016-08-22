var Vue = require('vue');
require('./trelloApiHelper.js');
require('./graphHandler.js')

window.trelloHandler = new Vue({
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
            Trello.deauthorize(); //Fix this
            Trello.authorize({
              type: 'popup',
              name: 'Ticket Dependency Graph',
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
        },

        addDependency: function(parentId, childId) {
            var childCard  = null;
            var parentCard = null;
            if (null == this.cards) {
                console.warn('Fail adding dependency in Trello');
                return false;
            }
            for (var i = 0; i < this.cards.length; i++) {
                if (this.cards[i].idShort == childId) {
                    childCard = this.cards[i];
                }
                if (this.cards[i].idShort == parentId) {
                    parentCard = this.cards[i];
                }
            }
            if (null == childCard || null == parentCard) {
                console.warn('Fail adding dependency in Trello');
                return false;
            }
            this.getOrCreateDependencyChecklist(childCard).then(function(checklist) {
                var checkItem = {
                    "name": parentCard.url
                }
                Trello.post('/checklists/' + checklist.id + '/checkItems', checkItem);
            });

        },

        getOrCreateDependencyChecklist: function(card) {
            return new Promise(function(resolve, reject) {
                Trello.get('/cards/' + card.id + '/checklists').then(function(checklists) {
                    for (var i = 0; i < checklists.length; i++) {
                        if ("Dependencies" == checklists[i].name) {
                            resolve(checklists[i]);
                        }
                    }
                    var checklist = {
                        "name": "Dependencies",
                        "idCard": card.id,
                    }
                    Trello.post('/checklists/', checklist).then(function(data) {
                        resolve(data);
                    });
                });
            });
        }

    }
})
