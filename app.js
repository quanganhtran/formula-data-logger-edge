/**
 * Created by Anh on 5/28/2016.
 */
var can = require('socketcan');

var channel = can.createRawChannel("vcan0", true);

// Log any message
channel.addListener("onMessage", function(msg) { console.log(msg); } );

channel.start();