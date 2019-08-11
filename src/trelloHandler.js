const Vue = require('vue');
require('./trelloApiHelper.js');
require('./graphHandler.js');

const lastBoardChoice = 'lastBoardChoice';
const lastListChoice = 'lastListChoice';

window.trelloHandler = new Vue({
  el: '#trello',

  data: {
    authenticated: false,
    boards: null,
    selectedBoard: null,
    lists: null,
    selectedList: null,
    cards: null,
    loading: false,
    trelloUrl: null,
  },

  methods: {
    onBoardChange(event) {
      const boardId = event.target.value;

      this.selectBoard(boardId).then(() => {
        window.localStorage.setItem(lastBoardChoice, boardId);
      });
    },

    onListChange(event) {
      const listId = event.target.value;

      this.selectList(listId).then(() => {
        window.localStorage.setItem(lastListChoice, listId);
      });
    },

    authorize() {
      window.Trello.deauthorize(); // Fix this
      window.Trello.authorize({
        type: 'popup',
        name: 'Ticket Dependency Graph',
        scope: {
          read: 'true',
          write: 'false',
        },
        expiration: 'never',
        success: this.authSuccessHandler,
        error() {
          console.warn('Failed authentication'); // eslint-disable-line no-console
        },
      });
    },

    authSuccessHandler() {
      const vm = this;
      console.log('Successful authentication'); // eslint-disable-line no-console
      this.loading = true;
      window.Trello.get('/member/me/boards').then(data => {
        vm.boards = data;
        vm.loading = false;

        // Thanks to Vue.nextTick, we wait for Vue to update the DOM, for the board dropdown to be filled with
        // the list of boards before retrieveLastBoardAndListChoice sets a chosen value in the board dropdown.
        Vue.nextTick(vm.retrieveLastBoardAndListChoice);
      });
    },

    refresh() {
      const vm = this;
      this.loading = true;
      return window.Trello.get(`/lists/${this.selectedList}/cards`).then(
        data => {
          vm.cards = data;
          vm.deleteUselessCards();
          vm.addOrUpdateCards();
          vm.calculateDependenciesAsPromises().then(linkDataArray => {
            window.myDiagram.model.linkDataArray = linkDataArray;
            vm.loading = false;
          });
        }
      );
    },

    retrieveLastBoardAndListChoice() {
      const boardChoiceId = window.localStorage.getItem(lastBoardChoice);
      const listChoiceId = window.localStorage.getItem(lastListChoice);

      if (!boardChoiceId || !listChoiceId) {
        return Promise.resolve();
      }

      return this.selectBoard(boardChoiceId).then(() =>
        Vue.nextTick(() => {
          this.selectList(listChoiceId);
        })
      );
    },

    selectBoard(boardId) {
      this.selectedBoard = boardId;

      return Promise.all([
        window.Trello.get(`/boards/${boardId}/lists`),
        window.Trello.get(`/boards/${boardId}/shortUrl`),
      ]).then(([lists, trelloUrl]) => {
        this.lists = lists;
        this.trelloUrl = trelloUrl._value; // eslint-disable-line no-underscore-dangle
      });
    },

    selectList(listId) {
      this.selectedList = listId;
      return this.refresh();
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
          new Promise(resolve => {
            vm.getOrCreateDependencyChecklist(vm.cards[iCard]).then(
              checklist => {
                const ticketIds = vm.getDependentTicketsFromChecklist(
                  checklist
                );
                for (let j = 0; j < ticketIds.length; j += 1) {
                  linkDataArray.push({
                    from: ticketIds[j].ticketId,
                    to: vm.getTicketIdFromIdCard(checklist.idCard),
                  });
                }
                resolve();
              }
            );
          })
        );
      }
      return new Promise(resolve => {
        Promise.all(promises).then(() => {
          resolve(linkDataArray);
        });
      });
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
        console.warn('Fail adding dependency in Trello'); // eslint-disable-line no-console
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
        console.warn('Fail adding dependency in Trello'); // eslint-disable-line no-console
        return false;
      }
      return this.getOrCreateDependencyChecklist(childCard).then(checklist => {
        const checkItem = {
          name: parentCard.url,
        };
        window.Trello.post(`/checklists/${checklist.id}/checkItems`, checkItem);
      });
    },

    deleteTrelloDependency(parentId, childId) {
      const vm = this;
      let childCard = null;
      if (this.cards == null) {
        console.warn('Fail deleting dependency in Trello'); // eslint-disable-line no-console
        return false;
      }
      for (let i = 0; i < this.cards.length; i += 1) {
        if (this.cards[i].idShort === childId) {
          childCard = this.cards[i];
        }
      }
      if (childCard == null) {
        console.warn('Fail deleting dependency in Trello'); // eslint-disable-line no-console
        return false;
      }
      return this.getOrCreateDependencyChecklist(childCard).then(checklist => {
        const ticketIds = vm.getDependentTicketsFromChecklist(checklist);
        for (let i = 0; i < ticketIds.length; i += 1) {
          if (ticketIds[i].ticketId === parentId) {
            window.Trello.delete(
              `/checklists/${checklist.id}/checkItems/${ticketIds[i].checkItemId}`
            );
            console.log('Dependency deleted'); // eslint-disable-line no-console
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
      return new Promise(resolve => {
        window.Trello.get(`/cards/${card.id}/checklists`).then(checklists => {
          for (let k = 0; k < checklists.length; k += 1) {
            if (checklists[k].name === 'Dependencies') {
              return resolve(checklists[k]);
            }
          }
          const checklist = {
            name: 'Dependencies',
            idCard: card.id,
          };
          return window.Trello.post('/checklists/', checklist).then(data => {
            resolve(data);
          });
        });
      });
    },
  },
});
