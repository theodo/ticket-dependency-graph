var go = require('gojs');
var GO = go.GraphObject.make;
window.myDiagram = GO(go.Diagram, "dependencyGraph", {
    initialContentAlignment: go.Spot.Center,
    allowCopy: false,
    layout: GO(go.LayeredDigraphLayout,
        { angle: 90, layerSpacing: 10 })
});

window.myDiagram.nodeTemplate = GO(
    go.Node,
    "Auto",
    { isShadowed: true, shadowColor: "#C5C1AA" },
    {
        mouseDrop: function (e, node) {
            var diagram = node.diagram;
            var selnode = diagram.selection.first();  // assume just one Node in selection
            if (selnode instanceof go.Node) {
                window.graphHandler.addDependency(node.data.key, selnode.data.key);
            }
        }
    },
    GO(go.Shape, "RoundedRectangle", { strokeWidth: 1, fill: "white"}),
    GO(go.Panel, "Horizontal",
        GO(go.TextBlock, { margin: 12, font: "bold 20px sans-serif" },
        new go.Binding("text", "key")),
        GO(go.TextBlock, { margin: 12, stroke: "#64AD35", font: "bold 14px sans-serif" },
        new go.Binding("text", "complexity")),
        GO(go.TextBlock, { margin: 12, stroke: "#666666", font: "bold 14px sans-serif" },
        new go.Binding("text", "branchComplexity")),
        GO(go.TextBlock, { margin: 8, font: "bold 10px sans-serif",  width: 100, wrap: go.TextBlock.WrapFit },
        new go.Binding("text", "name"))
    )
);

//To be populated with Trello
var myModel = GO(go.GraphLinksModel);
myModel.nodeDataArray = [
    { key: 1 , complexity: 13, branchComplexity: null, name: "Connect to Trello to use the TDG"},
    { key: 2 , complexity: 5, branchComplexity: null, name: "Choose a board, a list, and you're good to go!"},
    { key: 3 , complexity: 8, branchComplexity: null, name: "You can add a link between two tickets given their id using the form below"},
    { key: 4 , complexity: 1, branchComplexity: null, name: "Or you can use Drag&Drop: simply drag a ticket over a ticket it depends on"},
    { key: 5 , complexity: 0.5, branchComplexity: null, name: "To delete a link, select it with your mouse and press the Delete key"},
    { key: 6 , complexity: null, branchComplexity: null, name: "Dependencies will be stored on your Trello board!"},
    { key: 7 , complexity: null, branchComplexity: null, name: "Enjoy!"},
];

myModel.linkDataArray =
[
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 2, to: 4 },
    { from: 3, to: 5 },
    { from: 4, to: 5 }
];

window.myDiagram.linkTemplate =
  GO(go.Link,
    GO(go.Shape, { strokeWidth: 5, stroke: "#555" }));


myDiagram.addDiagramListener("SelectionDeleting", function(e) {
 var part = e.subject.first(); // e.subject is the myDiagram.selection collection,
                               // so we'll get the first since we know we only have one selection
 if (part instanceof go.Link) {
   var childId = part.toNode.data.key;
   var parentId = part.fromNode.data.key;
   window.graphHandler.resetChildrenBranchComplexity(childId);
   window.trelloHandler.deleteTrelloDependency(parentId, childId);
 }
});

myDiagram.addDiagramListener("ObjectContextClicked", function(e) {
    var part = e.subject.part;
    if (part instanceof go.Node) {
        window.graphHandler.computeBranchComplexity(part.data.key);
    }
});

window.myDiagram.model = myModel;
