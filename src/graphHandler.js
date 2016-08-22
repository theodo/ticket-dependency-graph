require('./graph.js')
var Vue = require('vue');
var getComplexityFromName = function(name) {
    if (name[0] != '(') {
        return null;
    }
    return res = name.split(")")[0].split("(")[1];
}

var getNameWithoutComplexity = function(name) {
    if (name[0] != '(') {
        return name;
    }
    return name.split(")")[1];
}

window.graphHandler = new Vue({
    el: '#graphHandler',

    data: {
        currentParent: '',
        currentChild: '',
        newTicketId: '',
        newTicketName: '',
        dataAsJson: ''
    },

    methods: {
        addDependency: function(parent, child) {
            this.addGraphDependency(parent, child);
            window.trelloHandler.addTrelloDependency(parent, child);
        },

        addGraphDependency: function(parent, child) {
            window.myDiagram.startTransaction("Add dependency");
            window.myDiagram.model.addLinkData({
                from: parseInt(parent),
                to: parseInt(child)
            })
            window.myDiagram.commitTransaction("Add dependency");

            this.currentChild = '';
            this.currentParent = '';
        },

        addOrUpdateTicket: function(ticketId, ticketName) {
            currentNode = window.myDiagram.model.findNodeDataForKey(ticketId)
            if (null == currentNode) {
                window.myDiagram.startTransaction("Add ticket");
                var newTicket = { key: ticketId,
                                  name: getNameWithoutComplexity(ticketName),
                                  complexity: getComplexityFromName(ticketName)};
                window.myDiagram.model.addNodeData(newTicket);
                window.myDiagram.commitTransaction("Add ticket");
            } else {
                window.myDiagram.startTransaction("Update ticket");
                window.myDiagram.model.setDataProperty(currentNode, "name", getNameWithoutComplexity(ticketName));
                window.myDiagram.model.setDataProperty(currentNode, "complexity", getComplexityFromName(ticketName));
                window.myDiagram.commitTransaction("Update ticket");
            }
        },

        removeTicket: function(ticketId) {
            currentNode = window.myDiagram.findNodeForKey(ticketId)
            if (null != currentNode) {
                window.myDiagram.startTransaction("Remove ticket");
                window.myDiagram.remove(currentNode)
                window.myDiagram.commitTransaction("Remove ticket");
            }
        },

        getNodes: function() {
            return window.myDiagram.model.nodeDataArray;
        },

        saveData: function() {
            this.dataAsJson = window.myDiagram.model.toJson();
        },

        loadData: function() {
            window.myDiagram.model = go.Model.fromJson(this.dataAsJson);
        }
    }
})
