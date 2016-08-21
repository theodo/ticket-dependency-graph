var go = require('gojs');
var GO = go.GraphObject.make;
window.myDiagram = GO(go.Diagram, "dependencyGraph", {
    initialContentAlignment: go.Spot.Center,
    allowCopy: false,
    "undoManager.isEnabled": true, // enable Ctrl-Z to undo and Ctrl-Y to redo
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
                var selKey = selnode.key;
                var nodeKey = node.key;
                diagram.toolManager.linkingTool.insertLink(node, node.port, selnode, selnode.port);
            }
        }
    },
    GO(go.Shape, "RoundedRectangle", { strokeWidth: 0, fill: "white"}),
    GO(go.Panel, "Horizontal",
        GO(go.TextBlock, { margin: 12, font: "bold 20px sans-serif" },
        new go.Binding("text", "key")),
        GO(go.TextBlock, { margin: 12, stroke: "#64AD35", font: "bold 14px sans-serif" },
        new go.Binding("text", "complexity")),
        GO(go.TextBlock, { margin: 8, font: "bold 10px sans-serif",  width: 100, wrap: go.TextBlock.WrapFit },
        new go.Binding("text", "name"))
    )
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

window.myDiagram.linkTemplate =
  GO(go.Link,
    GO(go.Shape, { strokeWidth: 5, stroke: "#555" }));

window.myDiagram.model = myModel;
