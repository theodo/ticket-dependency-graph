const Vue = require('vue');
require('./trelloApiHelper.js');
require('./graphHandler.js');

window.trelloHandler = new Vue({
  el: '#trello',

  data: {
    authenticated: false,
    boards: null,
    selectedBoard: null,
    lists: null,
    selectedLists: null,
    cards: null,
    loading: false,
    trelloUrl: null,
  },

  watch: {
    selectedBoard(val) {
      const vm = this;
      if (val.length > 0) {
        Trello.get(`/boards/${val}/lists`).then((data) => {
          vm.lists = data;
        });
        Trello.get(`/boards/${val}/shortUrl`).then((data) => {
          vm.trelloUrl = data._value; // eslint-disable-line
        });
      }
    },
    selectedLists: {
      handler(val) {
        const vm = this;
        if (val.length > 0) {
          vm.refresh();
        }
      },
      deep: true,
    },
  },

  methods: {
    authorize() {
      Trello.deauthorize(); // Fix this
      Trello.authorize({
        type: 'popup',
        name: 'Ticket Dependency Graph',
        scope: {
          read: 'true',
          write: 'false',
        },
        expiration: 'never',
        success: this.authSuccessHandler,
        error() {
          console.warn('Failed authentication');
        },
      });
    },

    authSuccessHandler() {
      const vm = this;
      console.log('Successful authentication');
      this.loading = true;
      Trello.get('/member/me/boards').then((data) => {
        vm.boards = data;
        vm.loading = false;
      });
    },

    refresh() {
      const vm = this;
      this.loading = true;
      Promise.all(
        this.selectedLists
          .map(list => Trello.get(`/lists/${list.id}/cards`)),
      )
        .then((allCards) => {
          vm.cards = [].concat(...allCards);
          vm.deleteUselessCards();
          vm.addOrUpdateCards();
          vm.calculateDependenciesAsPromises().then((linkDataArray) => {
            window.myDiagram.model.linkDataArray = linkDataArray;
            vm.loading = false;
          });
        });
    },

    addOrUpdateCards() {
      for (let i = 0; i < this.cards.length; i += 1) {
        const card = this.cards[i];
        window.graphHandler.addOrUpdateTicket(card.idShort, card.name);
      }
    },

    deleteUselessCards() {
      const nodes = window.graphHandler.getNodes();
      const toBeRemoved = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (!this.isTicketIdInList(node.key)) {
          toBeRemoved.push(node.key);
        }
      }
      for (let i = 0; i < toBeRemoved.length; i += 1) {
        window.graphHandler.removeTicket(toBeRemoved[i]);
      }
    },

    calculateDependenciesAsPromises() {
      const vm = this;
      const linkDataArray = [];
      const promises = [];
      for (let iCard = 0; iCard < vm.cards.length; iCard += 1) {
        promises.push(
          new Promise(((resolve) => {
            vm.getOrCreateDependencyChecklist(vm.cards[iCard]).then((checklist) => {
              const ticketIds = vm.getDependentTicketsFromChecklist(checklist);
              for (let j = 0; j < ticketIds.length; j += 1) {
                linkDataArray.push({
                  from: ticketIds[j].ticketId,
                  to: vm.getTicketIdFromIdCard(checklist.idCard),
                });
              }
              resolve();
            });
          })),
        );
      }
      return new Promise(((resolve) => {
        Promise.all(promises).then(() => {
          resolve(linkDataArray);
        });
      }));
    },

    getTicketIdFromIdCard(idCard) {
      if (this.cards == null) {
        return null;
      }
      for (let i = 0; i < this.cards.length; i += 1) {
        if (this.cards[i].id === idCard) {
          return this.cards[i].idShort;
        }
      }
      return null;
    },

    isTicketIdInList(ticketId) {
      for (let i = 0; i < this.cards.length; i += 1) {
        if (this.cards[i].idShort === ticketId) {
          return true;
        }
      }
      return false;
    },

    addTrelloDependency(parentId, childId) {
      let childCard = null;
      let parentCard = null;
      if (this.cards == null) {
        console.warn('Fail adding dependency in Trello');
        return false;
      }
      for (let i = 0; i < this.cards.length; i += 1) {
        if (this.cards[i].idShort === childId) {
          childCard = this.cards[i];
        }
        if (this.cards[i].idShort === parentId) {
          parentCard = this.cards[i];
        }
      }
      if (childCard == null || parentCard == null) {
        console.warn('Fail adding dependency in Trello');
        return false;
      }

      return this.getOrCreateDependencyChecklist(childCard).then((checklist) => {
        const checkItem = {
          name: parentCard.url,
        };
        Trello.post(`/checklists/${checklist.id}/checkItems`, checkItem);
      });
    },

    deleteTrelloDependency(parentId, childId) {
      const vm = this;
      let childCard = null;
      if (this.cards == null) {
        console.warn('Fail deleting dependency in Trello');
        return false;
      }
      for (let i = 0; i < this.cards.length; i += 1) {
        if (this.cards[i].idShort === childId) {
          childCard = this.cards[i];
        }
      }
      if (childCard == null) {
        console.warn('Fail deleting dependency in Trello');
        return false;
      }
      return this.getOrCreateDependencyChecklist(childCard).then((checklist) => {
        const ticketIds = vm.getDependentTicketsFromChecklist(checklist);
        for (let i = 0; i < ticketIds.length; i += 1) {
          if (ticketIds[i].ticketId === parentId) {
            Trello.delete(`/checklists/${checklist.id}/checkItems/${ticketIds[i].checkItemId}`);
            console.log('Dependency deleted');
            return;
          }
        }
      });
    },

    getDependentTicketsFromChecklist(checklist) {
      const ticketIds = [];
      if (checklist.checkItems == null) {
        return ticketIds;
      }
      for (let i = 0; i < checklist.checkItems.length; i += 1) {
        const checkItem = checklist.checkItems[i];
        ticketIds.push({
          checkItemId: checkItem.id,
          ticketId: this.getTicketIdFromCheckItemName(checkItem.name),
        });
      }
      return ticketIds;
    },

    getTicketIdFromCheckItemName(checkItemName) {
      if (checkItemName[0] === '#') {
        return checkItemName.split('#')[1];
      }
      return parseInt(checkItemName.split('/')[5].split('-')[0], 10);
    },

    getOrCreateDependencyChecklist(card) {
      return new Promise(((resolve) => {
        Trello.get(`/cards/${card.id}/checklists`).then((checklists) => {
          for (let k = 0; k < checklists.length; k += 1) {
            if (checklists[k].name === 'Dependencies') {
              return resolve(checklists[k]);
            }
          }
          const checklist = {
            name: 'Dependencies',
            idCard: card.id,
          };
          return Trello.post('/checklists/', checklist).then((data) => {
            resolve(data);
          });
        });
      }));
    },
  },
});
