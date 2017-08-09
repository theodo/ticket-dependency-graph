#ticket-dependency-graph
Use this tool with Trello to visualize the dependencies between your tickets

##Demo
Link for [live demo](https://theodo.github.io/ticket-dependency-graph/)

##Installation
```
git clone https://github.com/theodo/ticket-dependency-graph.git
cd ticket-dependency-graph
npm install
npm start
```
Server should be running on `http://localhost:8080/webpack-dev-server/`

##Usage
* Authorize the application to bind with your Trello account
* Choosing a column will fetch all the cards from that colummn
* Drag and drop a card on another to mark a dependency (or use form below the graph)
* You can also use the form below the graph to add a dependency between two tickets based on their id
* The dependency will be stored in the checklist "Dependencies" of the Trello card
* To delete a dependency, simply click on a link and press delete
* You can directly modify the dependencies within Trello : as an item of the "Dependencies" checklist, you can either use the URL of a ticket or its id (e.g.: #131)
* Each time you change something in Trello (adding, moving, copying or deleting a ticket), hit "Refresh" to keep in sync.

##Tips
* It's faster to use the form to add a dependency
* You can Drag & Drop the tickets to move them around and arrange them before you print the graph
* For better visibility, you can delete a ticket from the graph: it will not be deleted from Trello and will come back on next Refresh

##Known issues
* Tickets that are moved to another column disappear from the graph
* [More issues](https://github.com/Varal7/ticket-dependency-graph/issues)
