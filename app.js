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
    GO(go.TextBlock, { margin: 8, stroke: "white", font: "bold 10px sans-serif",  width: 100, wrap: go.TextBlock.WrapFit },
    new go.Binding("text", "name"))
);

//To be populated with Trello
var myModel = GO(go.GraphLinksModel);
myModel.nodeDataArray = [
    { key: 1 , name: "ETQU, j'ai un arbre de dépendances"},
    { key: 2 , name: "ETQU, j'ai la liste des tickets de mon board"},
    { key: 3 , name: "ETQU, j'ai un arbre de dépendances avec les tickets de mon boards"},
    { key: 4 , name: "ETQVictor, je réussis mon PISCAR"},
    { key: 5 , name: "ETQDev, j'ai accès à l'API TRello"},
];

myModel.linkDataArray =
[
    { from: 1, to: 3 },
    { from: 2, to: 3 },
    { from: 3, to: 4 }
];

myDiagram.model = myModel;

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
                var newTicket = { key: ticketId, name: ticketName};
                myDiagram.model.addNodeData(newTicket);
                myDiagram.commitTransaction("Add ticket");
            } else {
                myDiagram.startTransaction("Update ticket");
                myDiagram.model.setDataProperty(currentNode, "name", ticketName);
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

        saveData: function() {
            this.dataAsJson = myDiagram.model.toJson();
        },
    }
})
