// Constants
const HOST = 'http://192.168.0.103:3000';

var app = angular.module('DataLogger', ['ui.bootstrap']);

app.controller('DataLoggerCtrl', function($scope){
    var socket = io(HOST);

    var signalData = getTemplateData();
    $scope.cellTables = signalData.cellTables;
    $scope.tempTables = signalData.tempTables;
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
        var cellTables = [],
            tempTables = [],
            namedList = {},
            i, j, board, signal;
        for (i = 0; i < 12; i++) {
            board = [];
            for (j = 0; j < 12; j++) {
                signal = {
                    name: 'board' + (i + 1) + '_cell' + (j + 1),
                    value: 0
                };
                board.push(signal);
                namedList[signal.name] = signal;
            }
            cellTables.push({ cells: board });
        }
        for (i = 0; i < 12; i++) {
            board = [];
            for (j = 0; j < 5; j++) {
                signal = {
                    name: 'board' + (i + 1) + '_temp' + (j + 1),
                    value: 0
                };
                board.push(signal);
                namedList[signal.name] = signal;
            }
            signal = {
                name: 'board' + (i + 1) + '_vref',
                value: 0
            };
            board.push(signal);
            namedList[signal.name] = signal;
            tempTables.push({ cells: board });
        }
        return {
            cellTables: cellTables,
            tempTables: tempTables,
            namedList: namedList
        };
    }
});