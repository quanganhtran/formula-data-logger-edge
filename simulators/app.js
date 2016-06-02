/**
 * Created by Anh on 5/28/2016.
 */
// Configuration constants
const CHANNEL_LINK = process.argv[2] || 'vcan0';

// Dependencies
var util    = require('util'),
    can     = require('socketcan'),
    fs      = require('fs'),
    express = require('express'),
    app     = express(),
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
app.set('view engine', 'html');
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.get('/', function (req, res) {
    res.render('index', getTemplateData());
});

// Socket IO initialization
server.listen(3000);
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
console.log('Web server started.');

initListeners();
console.log('CAN service initialized');

function getTemplateData() {
    var boards = [];
    for (var i = 0; i < 12; i++) {
        var board = [];
        for (var j = 0; j < 12; j++) {
            board.push({ name: 'board' + (i + 1) + 'cell' + (j + 1) });
        }
        boards.push({ cells: board});
    }
    return {
        cellTables: boards
    };
}

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