// Environment variables
process.env['EDGE_CS_DEBUG'] = 1;

// Configuration constants
const CHANNEL_LINK = process.argv[2] || 'vcan0';

// Dependencies

var edge    = require('edge'),
    express = require('express'),
    app     = express(),
    server  = require('http').Server(app),
    io      = require('socket.io')(server);

// TODO Port to Edge
// CAN initialization
var getKvaser = edge.func('canlibDbReadWrite.cs');
getKvaser({
    read: function (data, cb) {
        //console.log(data);
        setTimeout(function () {
            io.emit('data', data);
        }, 0);
        cb();
    }
}, function (error, kvaser) {
    kvaser.init();

    // Express initialization
    app.use('/assets', express.static(__dirname + '/assets'));
    app.use('/assets/uib', express.static(__dirname + '/node_modules/angular-ui-bootstrap'));
    app.use('/bower_components',  express.static(__dirname + '/bower_components'));

    // Socket IO initialization
    server.listen(3000);
    io.on('connection', function(socket){
        console.log('A client connected');
        socket.on('disconnect', function(){
            console.log('A client disconnected');
        });
        var acceptRequest = true;
        socket.on('request', function () {
            if (!acceptRequest) {
                return;
            }
            console.log('Web to BMS: Requesting info');
            acceptRequest = false;
            setTimeout(function () {
                acceptRequest = true;
            }, 400);
            kvaser.request();
        });
        var ctrlMsgName = 'Status_data_of_BMS';
        socket.on('settings', function (signals) {
            // TODO Send settings frame to Edge
            kvaser.send(signals);
        });
    });
    console.log('Web server started.');
});

function getTemplateData() {
    var boards = [];
    for (var i = 0; i < 12; i++) {
        var board = [];
        for (var j = 0; j < 12; j++) {
            board.push({ name: 'board' + (i + 1) + 'cell' + (j + 1) });
        }
        boards.push({ cells: board });
    }
    return {
        cellTables: boards
    };
}
