// Constants
const HOST = 'http://192.168.0.103:3000';

var app = angular.module('DataLogger', []);

app.controller('DataLoggerCtrl', function($scope){
    var socket = io(HOST);

    var signalData = getTemplateData();
    $scope.cellTables = signalData.cellTables;
    var flatList = signalData.namedList;

    socket.on('data', function(sig){
        if (flatList[sig.name]) {
            flatList[sig.name].value = sig.value;
            $scope.$digest();
        } else {
            console.log(sig);
        }
    });

    function getTemplateData() {
        var boards = [],
            namedList = {};
        for (var i = 0; i < 12; i++) {
            var board = [];
            for (var j = 0; j < 12; j++) {
                var signal = {
                    name: 'board' + (i + 1) + '_cell' + (j + 1),
                    value: 0
                };
                board.push(signal);
                namedList[signal.name] = signal;
            }
            boards.push({ cells: board });
        }
        return {
            cellTables: boards,
            namedList: namedList
        };
    }
});