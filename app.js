/**
 * Created by Anh on 5/28/2016.
 */
// Configuration constants
const CHANNEL_LINK = process.argv[2] || 'vcan0';

// Dependencies
var util    = require('util'),
    can     = require('socketcan'),
    fs      = require('fs'),
    app     = require('express')(),
    server  = require('http').Server(app),
    io      = require('socket.io')(server),
    swig    = require('swig');

// CAN initialization
var network = can.parseNetworkDescription('messages.kcd');
var bus     = network.buses['BMS Bus'];
var channel = can.createRawChannel(CHANNEL_LINK);
var db      = new can.DatabaseService(channel, bus);

channel.start();
console.log('CAN channel started');

// Express initialization
app.engine('html', swig.renderFile);

// Socket IO initialization
server.listen(3000);
console.log('Web server started.');
io.on('connection', function(socket){
    console.log('A client connected');
    socket.on('disconnect', function(){
        console.log('A client disconnected');
    });
    socket.on('status', function(msg){
        console.log('An update request has been received');
        //socket.broadcast.emit('draw', msg);
    });
});

initListeners();
console.log('CAN service initialized');

function initListeners() {
    var msgNameList = network.nodes['1'].buses['BMS Bus'].produces.map(function (msg) {
        return msg.name;
    });
    for (var m in msgNameList) {
        var msg = msgNameList[m];
        if (db.messages.hasOwnProperty(msg)) {
            var message = db.messages[msg];
            for (var sig in message.signals) {
                if (message.signals.hasOwnProperty(sig)) {
                    message.signals[sig].onChange(function(s) {
                        console.log(s.name + ' ' + s.value);
                        io.emit('data', s);
                    });
                }
            }
        }
    }
}

function getNameList(messages) {
    return messages.map(function (msg) {
        return msg.name;
    });
}