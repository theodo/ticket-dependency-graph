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
            var link = {from: parent, to: child}
            window.myDiagram.model.addLinkData(link);
            currentNode = window.myDiagram.findNodeForKey(child);
            rootNode = currentNode.findTreeRoot();
            rootKey = rootNode.data.key;
            if (0 != rootNode.findLinksInto().count) {
                //Prevents creating some loops
                //App still crashes if loop already exists.
                console.log("Aborting. This creates a loop");
                window.myDiagram.model.removeLinkData(link);
                return;
            }
            this.resetChildrenBranchComplexity(child);
            this.computeBranchComplexity(child);
            window.trelloHandler.addTrelloDependency(parent, child);
        },

        resetChildrenBranchComplexity: function(nodeCur) {
            if (this.getBranchComplexity(nodeCur) == -1) {
                return;
            }
            this.setBranchComplexity(nodeCur, -1); //Prevents loops
            currentNode = window.myDiagram.findNodeForKey(nodeCur);
            var it = currentNode.findLinksOutOf();
            while (it.next()) {
                //it.value stores the link towards the child
                var childKey = it.value.data.to;
                this.resetChildrenBranchComplexity(childKey);
            }
            this.setBranchComplexity(nodeCur, null);
        },

        computeBranchComplexity: function(nodeCur) {
            if (null != this.getBranchComplexity(nodeCur)) {
                return this.getBranchComplexity(nodeCur);
            }
            var curComplexity = this.getComplexity(nodeCur)
            this.setBranchComplexity(nodeCur, -1); //Prevents loops
            currentNode = window.myDiagram.findNodeForKey(nodeCur);
            var it = currentNode.findLinksInto();
            var maxParentComplexity = 0;
            while (it.next()) {
                //it.value stores the link
                var parentKey = it.value.data.from;
                var parentBranchComplexity = this.computeBranchComplexity(parentKey);
                if (maxParentComplexity < parentBranchComplexity) {
                    maxParentComplexity = parentBranchComplexity;
                }
            }
            var branchComplexity = maxParentComplexity + curComplexity;
            this.setBranchComplexity(nodeCur, branchComplexity);
            return branchComplexity;
        },

        getComplexity: function(nodeId) {
            var complexity = window.myDiagram.model.findNodeDataForKey(nodeId).complexity;
            if (null == complexity) {
                return 0;
            }
            return parseFloat(complexity);
        },

        setBranchComplexity: function(nodeId, branchComplexity) {
            var node = window.myDiagram.model.findNodeDataForKey(nodeId)
            window.myDiagram.model.setDataProperty(node, "branchComplexity", branchComplexity);
        },

        getBranchComplexity: function(nodeId) {
            return window.myDiagram.model.findNodeDataForKey(nodeId).branchComplexity;
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
