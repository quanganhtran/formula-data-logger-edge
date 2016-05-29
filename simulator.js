/**
 * Created by Anh on 5/29/2016.
 */
var can = require('socketcan');
var fs = require('fs');

// Parse database
var network = can.parseNetworkDescription("messages.kcd");

var node = network.nodes['1'];

console.log("Simulating " + node.name);

var i = 0;
for (b in node.buses) {
    var c = can.createRawChannel("vcan" + i++);
    var d = new can.DatabaseService(c, network.buses[b]);

    c.start();

    console.log("Starting simulation " + b);

    // Generate all CAN message this node is the producer
    for (m in node.buses[b].produces) {
        var msg = node.buses[b].produces[m];
        d.send(msg.name);
    }
}