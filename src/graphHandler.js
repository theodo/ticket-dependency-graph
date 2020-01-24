const Vue = require('vue');
require('./graph.js');

const parseTicketName = name => {
  const matches = name.match(
    /^(?:\[(?<complexityReal>\d+[.,]?\d*)\])? ?(?:\((?<complexityEstimation>\d+[.,]?\d*)\))?(?: ?)(?<name>.+)$/
  );
  if (!matches)
    return {
      name,
      complexityEstimation: null,
      complexityReal: null,
    };
  return {
    name: matches[3] ? matches[3] : '',
    complexityEstimation: matches[2] ? matches[2] : null,
    complexityReal: matches[1] ? matches[1] : null,
  };
};

window.graphHandler = new Vue({
  el: '#graphHandler',

  data: {
    currentParent: '',
    currentChild: '',
    newTicketId: '',
    newTicketName: '',
    dataAsJson: '',
  },

  methods: {
    addDependency(parent, child) {
      this.addGraphDependency(parent, child);
      window.trelloHandler.addTrelloDependency(parent, child);
    },

    addGraphDependency(parent, child) {
      window.myDiagram.startTransaction('Add dependency');
      window.myDiagram.model.addLinkData({
        from: parent,
        to: child,
      });
      window.myDiagram.commitTransaction('Add dependency');

      this.currentChild = null;
      this.currentParent = null;
    },

    addOrUpdateTicket(ticketId, ticketName) {
      const currentNode = window.myDiagram.model.findNodeDataForKey(ticketId);
      const ticketInfo = parseTicketName(ticketName);
      if (currentNode == null) {
        window.myDiagram.startTransaction('Add ticket');
        const newTicket = ticketInfo;
        newTicket.key = ticketId;
        window.myDiagram.model.addNodeData(newTicket);
        window.myDiagram.commitTransaction('Add ticket');
      } else {
        window.myDiagram.startTransaction('Update ticket');
        window.myDiagram.model.setDataProperty(
          currentNode,
          'name',
          ticketInfo.name
        );
        window.myDiagram.model.setDataProperty(
          currentNode,
          'complexityEstimation',
          ticketInfo.complexityEstimation
        );
        window.myDiagram.model.setDataProperty(
          currentNode,
          'complexityReal',
          ticketInfo.complexityReal
        );
        window.myDiagram.commitTransaction('Update ticket');
      }
    },

    removeTicket(ticketId) {
      const currentNode = window.myDiagram.findNodeForKey(ticketId);
      if (currentNode != null) {
        window.myDiagram.startTransaction('Remove ticket');
        window.myDiagram.remove(currentNode);
        window.myDiagram.commitTransaction('Remove ticket');
      }
    },

    getNodes() {
      return window.myDiagram.model.nodeDataArray;
    },

    saveData() {
      this.dataAsJson = window.myDiagram.model.toJson();
    },

    loadData() {
      window.myDiagram.model = window.go.Model.fromJson(this.dataAsJson);
    },
  },
});
