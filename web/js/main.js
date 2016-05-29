// Constants
const HOST = 'http://192.168.0.103:3000';

var socket = io(HOST);

socket.on('data', function(sig){
    console.log(sig);
});