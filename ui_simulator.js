/**
 * Created by Anh on 5/28/2016.
 */
// Configuration constants
const CHANNEL_LINK = process.argv[2] || 'vcan0';

// Dependencies
var util    = require('util'),
    fs      = require('fs'),
    express = require('express'),
    app     = express(),
    server  = require('http').Server(app),
    io      = require('socket.io')(server),
    swig    = require('swig');

console.log('CAN channel started');

// Express initialization
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
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
    var ctrlMsgName = 'Status data of BMS';
    socket.on('settings', function (signal) {
        console.log(signal);
    });
    simulate();
});
console.log('Web server started.');

function simulate() {
    io.emit('data', {
        name: 'board' + (Math.floor(Math.random() * 12) + 1) + '_cell' + (Math.floor(Math.random() * 12) + 1),
        value: (Math.floor(Math.random() * 655.36) / 100)
    });
    setTimeout(simulate, 500);
}
