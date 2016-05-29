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

    // Generate all CAN message this node is the producer
    for (m in node.buses[b].produces) {
        console.log(m);
        var msg = node.buses[b].produces[m];
        for (var s = 0; s < msg.signals.length; s++) {
            d.messages[msg.name].signals[msg.signals[s].name].update(Math.floor(Math.random() * 65536));
        }
        //console.log(msg.signals.length);
        //for (var s = 0; s < msg.signals.length; i++) {
        //    var sName = msg.signals[s].name;
        //    //console.log(sName, d.messages[msg.name].signals[sName].value);
        //}
        //console.log('done this msg');
        d.send(msg.name);
    }
}
process.exit();