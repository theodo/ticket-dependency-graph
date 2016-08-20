var go = require('gojs');
var Vue = require('vue');
require('./trello.js');
var GO = go.GraphObject.make;
var myDiagram = GO(go.Diagram, "dependancyGraph", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true, // enable Ctrl-Z to undo and Ctrl-Y to redo
    layout: GO(go.LayeredDigraphLayout,
        { angle: 90, layerSpacing: 10 })
});

myDiagram.nodeTemplate = GO(
    go.Node,
    "Horizontal",
    { background: "#2221AD" },
    GO(go.TextBlock, { margin: 12, stroke: "yellow", font: "bold 16px sans-serif" },
    new go.Binding("text", "key")),
    GO(go.TextBlock, { margin: 12, stroke: "#64AD35", font: "bold 14px sans-serif" },
    new go.Binding("text", "complexity")),
    GO(go.TextBlock, { margin: 8, stroke: "white", font: "bold 10px sans-serif",  width: 100, wrap: go.TextBlock.WrapFit },
    new go.Binding("text", "name"))
);

//To be populated with Trello
var myModel = GO(go.GraphLinksModel);
myModel.nodeDataArray = [
    { key: 1 , complexity: 13, name: "ETQU, j'ai un arbre de dépendances"},
    { key: 2 , complexity: 8, name: "ETQU, j'ai la liste des tickets de mon board"},
    { key: 3 , complexity: 1, name: "ETQU, j'ai un arbre de dépendances avec les tickets de mon boards"},
    { key: 4 , complexity: 21, name: "ETQVictor, je réussis mon PISCAR"},
    { key: 5 , complexity: null, name: "ETQDev, j'ai accès à l'API TRello"},
];

myModel.linkDataArray =
[
    { from: 1, to: 3 },
    { from: 2, to: 3 },
    { from: 3, to: 4 }
];

myDiagram.linkTemplate =
  GO(go.Link,
    GO(go.Shape, { strokeWidth: 3, stroke: "#555" }));

myDiagram.model = myModel;


var getComplexityFromName = function(name) {
    if (name[0] != '(') {
        return null;
    }
    return res = parseInt(name.split(")")[0].split("(")[1]);
}

var getNameWithoutComplexity = function(name) {
    if (name[0] != '(') {
        return name;
    }
    return name.split(")")[1];
}

var main = new Vue({
    el: '#graphHandler',

    data: {
        currentParent: '',
        currentChild: '',
        newTicketId: '',
        newTicketName: '',
        dataAsJson: ''
    },

    methods: {
        addDependancy: function(parent, child) {
            myDiagram.startTransaction("Add dependancy");
            myDiagram.model.addLinkData({
                from: parseInt(parent),
                to: parseInt(child)
            })
            myDiagram.commitTransaction("Add dependancy");
        },

        addOrUpdateTicket: function(ticketId, ticketName) {
            currentNode = myDiagram.model.findNodeDataForKey(ticketId)
            if (null == currentNode) {
                myDiagram.startTransaction("Add ticket");
                var newTicket = { key: ticketId,
                                  name: getNameWithoutComplexity(ticketName),
                                  complexity: getComplexityFromName(ticketName)};
                myDiagram.model.addNodeData(newTicket);
                myDiagram.commitTransaction("Add ticket");
            } else {
                myDiagram.startTransaction("Update ticket");
                myDiagram.model.setDataProperty(currentNode, "name", getNameWithoutComplexity(ticketName));
                myDiagram.model.setDataProperty(currentNode, "complexity", getComplexityFromName(ticketName));
                myDiagram.commitTransaction("Update ticket");
            }
        },

        removeTicket: function(ticketId) {
            currentNode = myDiagram.findNodeForKey(ticketId)
            if (null != currentNode) {
                myDiagram.startTransaction("Remove ticket");
                myDiagram.remove(currentNode)
                myDiagram.commitTransaction("Remove ticket");
            }
        },

        getNodes: function() {
            return myDiagram.model.nodeDataArray;
        },

        saveData: function() {
            this.dataAsJson = myDiagram.model.toJson();
        },
    }
})
