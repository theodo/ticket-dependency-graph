var go = require('gojs');
var GO = go.GraphObject.make;
window.myDiagram = GO(go.Diagram, "dependancyGraph", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true, // enable Ctrl-Z to undo and Ctrl-Y to redo
    layout: GO(go.LayeredDigraphLayout,
        { angle: 90, layerSpacing: 10 })
});

window.myDiagram.nodeTemplate = GO(
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

window.myDiagram.linkTemplate =
  GO(go.Link,
    GO(go.Shape, { strokeWidth: 3, stroke: "#555" }));

window.myDiagram.model = myModel;
