/**
 * Created by Anh on 5/29/2016.
 */
var can = require('socketcan');
var util = require('util');
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

    simulateMsg(d, node.buses[b]);
}

function simulateMsg(db, bus) {
    var list = bus.produces;
    var index = Math.floor(Math.random() * list.length);
    var msg = list[index];
    for (var s = 0; s < msg.signals.length; s++) {
        db.messages[msg.name].signals[msg.signals[s].name].update(Math.floor(Math.random() * 65536));
    }
    console.log('Generating message index ' + index);
    db.send(msg.name);
    setTimeout(simulateMsg, 500, db, bus);
}