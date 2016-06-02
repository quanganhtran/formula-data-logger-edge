// Constants
const HOST = 'http://localhost:3000';

var app = angular.module('DataLogger', ['ui.bootstrap']);

app.controller('DataLoggerCtrl', function ($scope){
    var socket = io(HOST);

    var signalData = getTemplateData();
    $scope.cellTables = signalData.cellTables;
    $scope.tempTables = signalData.tempTables;
    var flatList = signalData.namedList;
    $scope.statusFlags = buildFlagsAndAttach(['abs_over', 'over_v', 'fullc_v', 'nomc_v', 'undc_v', 'fullb_v'], flatList);
    $scope.extStatusFlags = buildFlagsAndAttach(['over_t', 'nom_t', 'over_p', 'over_i', 'can_error', 'pec_error'], flatList);
    $scope.settingsFlags = buildFlagsAndAttach(['wdog_r', 'mode1', 'mode0', 'raw_temp', 'f1_mctrl', 'f2_mctrl', 'log_data', 'charge'], flatList);
    $scope.ioState = buildFlagsAndAttach(['pe7', 'pe6', 'pe5', 'pe4', 'pa7', 'pa6', 'pa5', 'pa4'], flatList);

    socket.on('data', function (sig) {
        if (flatList[sig.name]) {
            flatList[sig.name].value = sig.value;
            $scope.$digest();
        } else {
            // console.log(sig);
        }
    });

    $scope.updateSettings = function () {
        socket.emit('settings', $scope.settingsFlags);
    };

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

    function buildFlagsAndAttach(flags, attachTo) {
        var obj = flags.map(function (flag) {
            var flagObj = {
                name: flag,
                value: true
            };
            attachTo[flag] = flagObj;
            return flagObj;
        });
        return obj;
    }
});
