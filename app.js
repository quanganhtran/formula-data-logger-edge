/**
 * Created by Anh on 5/28/2016.
 */
// Configuration constants
const CHANNEL_LINK = process.argv[2] || 'vcan0';

// Dependencies
var util = require('util');
var can = require('socketcan');
var fs = require('fs');

// Parse database
var network = can.parseNetworkDescription('messages.kcd');
var bus = network.buses['BMS Bus'];
var channel = can.createRawChannel(CHANNEL_LINK);
var db      = new can.DatabaseService(channel, bus);

channel.start();

// Log any message
//var message = db.messages['Status data of BMS'];
//for (var sig in message.signals) {
//    console.log(message.signals[sig]);
//    if (message.signals.hasOwnProperty(sig)) {
//        message.signals[sig].onChange(function(s) {
//            console.log(s.name + ' ' + s.value);
//        });
//    }
//}
for (var msg in db.messages) {
    if (db.messages.hasOwnProperty(msg)) {
        var message = db.messages[msg];
        for (var sig in message.signals) {
            if (message.signals.hasOwnProperty(sig)) {
                message.signals[sig].onChange(function(s) {
                    console.log(s.name + ' ' + s.value);
                });
            }
        }
    }
}