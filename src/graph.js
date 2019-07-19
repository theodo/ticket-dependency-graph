const go = require('gojs');

const GO = go.GraphObject.make;

window.myDiagram = GO(go.Diagram, 'dependencyGraph', {
  initialContentAlignment: go.Spot.Center,
  'undoManager.isEnabled': true,
  allowCopy: false,
  autoScale: go.Diagram.Uniform,
  layout: GO(go.LayeredDigraphLayout, { direction: 90, layerSpacing: 10 }),
});

window.myDiagram.nodeTemplate = GO(
  go.Node,
  'Auto',
  {
    isShadowed: true,
    shadowColor: '#C5C1AA',
    layoutConditions: go.Part.LayoutAdded,
  },
  {
    mouseDrop(e, node) {
      const { diagram } = node;
      const selnode = diagram.selection.first(); // assume just one Node in selection
      if (selnode instanceof go.Node) {
        window.graphHandler.addDependency(node.data.key, selnode.data.key);
        selnode.data.hasJustBeenLinked = true;
        // eslint-disable-next-line no-param-reassign
        node.isLayoutPositioned = true;
      }
    },
  },
  GO(go.Shape, 'RoundedRectangle', { strokeWidth: 1, fill: 'white' }),
  GO(
    go.Panel,
    'Horizontal',
    GO(
      go.TextBlock,
      { margin: 12, font: 'bold 20px sans-serif' },
      new go.Binding('text', 'key')
    ),
    GO(
      go.TextBlock,
      { margin: 12, stroke: '#64AD35', font: 'bold 14px sans-serif' },
      new go.Binding('text', 'complexity')
    ),
    GO(
      go.TextBlock,
      {
        margin: 8,
        font: 'bold 10px sans-serif',
        width: 100,
        wrap: go.TextBlock.WrapFit,
      },
      new go.Binding('text', 'name')
    )
  )
);

// To be populated with Trello
const myModel = GO(go.GraphLinksModel);
myModel.nodeDataArray = [
  { key: 1, complexity: 13, name: 'Connect to Trello to use the TDG' },
  {
    key: 2,
    complexity: 5,
    name: "Choose a board, a list, and you're good to go!",
  },
  {
    key: 3,
    complexity: 8,
    name:
      'You can add a link between two tickets given their id using the form below',
  },
  {
    key: 4,
    complexity: 1,
    name:
      'Or you can use Drag&Drop: simply drag a ticket over a ticket it depends on',
  },
  {
    key: 5,
    complexity: 0.5,
    name:
      'To delete a link, select it with your mouse and press the Delete key',
  },
  {
    key: 6,
    complexity: null,
    name: 'Dependencies will be stored on your Trello board!',
  },
  { key: 7, complexity: null, name: 'Enjoy!' },
];

myModel.linkDataArray = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 5 },
];

window.myDiagram.linkTemplate = GO(
  go.Link,
  GO(go.Shape, { strokeWidth: 5, stroke: '#555' })
);

window.myDiagram.addDiagramListener('SelectionDeleting', e => {
  const part = e.subject.first(); // e.subject is the myDiagram.selection collection,
  // so we'll get the first since we know we only have one selection
  if (part instanceof go.Link) {
    const childId = part.toNode.data.key;
    const parentId = part.fromNode.data.key;
    window.trelloHandler.deleteTrelloDependency(parentId, childId);
  }
});

window.myDiagram.addDiagramListener('SelectionMoved', e => {
  e.subject.each(part => {
    if (part.data.hasJustBeenLinked) {
      part.data.hasJustBeenLinked = false; // eslint-disable-line no-param-reassign
      part.isLayoutPositioned = true; // eslint-disable-line no-param-reassign
    } else part.isLayoutPositioned = false; // eslint-disable-line no-param-reassign
  });
});

window.myDiagram.model = myModel;
