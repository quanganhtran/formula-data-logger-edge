// Constants
const HOST = 'http://192.168.0.101:3000';

var app = angular.module('DataLogger', ['ui.bootstrap']);

app.config(function ($uibTooltipProvider) {
    $uibTooltipProvider.setTriggers({
        'click': 'mouseleave'
    })
});

app.controller('DataLoggerCtrl', function ($scope){
    var socket = io(HOST);

    var signalData = getTemplateData();
    $scope.cellTables = signalData.cellTables;
    $scope.tempTables = signalData.tempTables;
    var flatCells = signalData.flatCells;
    var flatTemps = signalData.flatTemps;
    var flatList = signalData.namedList;
    $scope.identifier = { name: 'identifier', value: 1 };
    flatList['identifier'] = $scope.identifier;
    $scope.totalIc = { name: 'total_ic', value: 1 };
    flatList['total_ic'] = $scope.totalIc;
    $scope.statusFlags = buildFlagsAndAttach(['fullb_v', 'undc_v', 'nomc_v', 'fullc_v', 'over_v', 'abs_over'], flatList);
    $scope.extStatusFlags = buildFlagsAndAttach(['pec_error', 'can_error', 'over_i', 'over_p', 'nom_t', 'over_t'], flatList);
    $scope.settingsFlags = buildFlagsAndAttach(['charge', 'log_data', 'f2_mctrl', 'f1_mctrl', 'raw_temp', 'mode0', 'mode1', 'wdog_r'], flatList);
    $scope.ioState = buildFlagsAndAttach(['pa4', 'pa5', 'pa6', 'pa7', 'pe4', 'pe5', 'pe6', 'pe7'], flatList);
    $scope.fan1Dc = { name: 'fan1_dc', value: 101 };
    flatList['fan1_dc'] = $scope.fan1Dc;
    $scope.fan2Dc = { name: 'fan2_dc', value: 202 };
    flatList['fan2_dc'] = $scope.fan2Dc;

    socket.on('data', function (sig) {
        if (flatList[sig.name]) {
            flatList[sig.name].value = sig.value;
            $scope.$digest();
        } else {
            console.log(sig);
        }
    });

    $scope.updateSettings = function () {
        console.log('Sending to the server...');
        console.log($scope.settingsFlags);
        socket.emit('settings', $scope.settingsFlags);
    };

    $scope.updateFanDc = function (fanIndex) {
        var fans = ['', 'fan1Dc', 'fan2Dc'];
        var fan = $scope[fans[fanIndex]];
        console.log('Sending to the server...');
        console.log(fan);
        socket.emit('settings', [{name: fan.name, value: fan.newValue}]);
        delete fan.newValue;
    };

    var aggregation = {
        min: function (signals) {
            return signals.reduce(function (value, b) {
                return Math.min(value, b.value)
            }, signals[0].value);
        },
        max: function (signals) {
            return signals.reduce(function (value, b) {
                return Math.max(value, b.value)
            }, signals[0].value);
        },
        sum: function (signals) {
            return signals.reduce(function (value, b) {
                return value + b.value
            }, 0);
        }
    };
    $scope.agg = {};
    var tempCount = flatTemps.length;

    function aggregateInterval() {
        $scope.agg.cellMin = aggregation.min(flatCells).toFixed(2);
        $scope.agg.cellMax = aggregation.max(flatCells).toFixed(2);
        $scope.agg.cellSum = aggregation.sum(flatCells).toFixed(2);
        $scope.agg.tempMin = aggregation.min(flatTemps).toFixed(2);
        $scope.agg.tempMax = aggregation.max(flatTemps).toFixed(2);
        $scope.agg.tempAvg = (aggregation.sum(flatTemps) / tempCount).toFixed(2);
        setTimeout(aggregateInterval, 500);
    }
    aggregateInterval();

    function getTemplateData() {
        var cellTables = [],
            tempTables = [],
            flatCells = [],
            flatTemps = [],
            namedList = {},
            i, j, board, signal;
        for (i = 0; i < 6; i++) {
            board = [];
            for (j = 0; j < 24; j++) {
                signal = {
                    name: 'board' + ((i*2 + Math.floor(j/12)) + 1) + '_cell' + (j%12 + 1),
                    value: 0
                };
                board.push(signal);
                flatCells.push(signal);
                namedList[signal.name] = signal;
            }
            cellTables.push({ cells: board });
        }
        var _temps = ['_temp1', '_temp2', '_temp3', '_temp4', '_temp5'];
        for (i = 0; i < 6; i++) {
            board = [];
            for (j = 0; j < 10; j++) {
                signal = {
                    name: 'board' + ((i*2 + Math.floor(j/5)) + 1) + '_temp' + (j%5 + 1),
                    value: 0
                };
                board.push(signal);
                flatTemps.push(signal);
                namedList[signal.name] = signal;
            }
            tempTables.push({ cells: board });
        }
        return {
            cellTables: cellTables,
            tempTables: tempTables,
            flatCells: flatCells,
            flatTemps: flatTemps,
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
