// Constants
const HOST = 'http://192.168.0.110:3000';

var app = angular.module('DataLogger', ['ui.bootstrap']);

app.config(function ($uibTooltipProvider) {
    $uibTooltipProvider.setTriggers({
        'click': 'mouseleave'
    })
});

app.controller('DataLoggerCtrl', ['$scope', 'uibButtonConfig', function ($scope, uibButtonConfig){
    uibButtonConfig.activeClass = 'btn-success';

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
    $scope.fan1Dc = { name: 'fan1_dc', value: 127 };
    flatList['fan1_dc'] = $scope.fan1Dc;
    $scope.fan2Dc = { name: 'fan2_dc', value: 127 };
    flatList['fan2_dc'] = $scope.fan2Dc;
    $scope.current = { name: 'current', value: 0 };
    flatList['current'] = $scope.current;

    socket.on('data', function (sig) {
        if (flatList[sig.name]) {
            flatList[sig.name].value = sig.value;
            $scope.$digest();
        } else {
            console.log(sig);
            if (sig.name === 'error_code') {
                $scope.addLog('error', 'An error has occured.', sig.value);
            } else {
                $scope.addLog('info', sig.name, sig.value);
            }
        }
    });

    $scope.requestInfo = function () {
        console.log('Requesting info from BMS...');
        socket.emit('request');
    };

    $scope.autoRequest = false;
    $scope.toggleInfo = (function () {
        var id;
        return function() {
            if ($scope.autoRequest) {
                clearInterval(id);
            } else {
                id = setInterval($scope.requestInfo, 500);
            }
            $scope.autoRequest = !$scope.autoRequest;
        }
    })();

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

    $scope.updateIoState = function () {
        console.log('Sending to the server...');
        console.log($scope.ioState);
        socket.emit('settings', $scope.ioState);
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

    var logs = [];
    $scope.logging = {
        logs: logs,
        verbose: false
    };
    $scope.addLog = function (type, text, data) {
        type = type || 'info';
        if ($scope.logging.verbose === false && type !== 'error') return;
        logs.unshift({
            type: type,
            text: text,
            data: data,
            timestamp: new Date()
        });
        if (logs.length > 20) {
            logs.pop();
        }
    };

    function aggregateInterval() {
        var ctbs = $scope.cellTables;
        ctbs.forEach(function (ctb) {
            ctb.agg = {
                min: aggregation.min(ctb.cells),
                max: aggregation.max(ctb.cells),
                sum: aggregation.sum(ctb.cells)
            };
        });
        var ttbs = $scope.tempTables;
        ttbs.forEach(function (ttb) {
            ttb.agg = {
                min: aggregation.min(ttb.cells),
                max: aggregation.max(ttb.cells),
                sum: aggregation.sum(ttb.cells)
            };
            ttb.agg.avg = (ttb.agg.sum / ttb.cells.length);
        });
        $scope.agg.cellMin = aggregation.min(ctbs.map(ctb => ({ value: ctb.agg.min })));
        $scope.agg.cellMax = aggregation.max(ctbs.map(ctb => ({ value: ctb.agg.max })));
        $scope.agg.cellSum = aggregation.sum(ctbs.map(ctb => ({ value: ctb.agg.sum })));
        $scope.agg.tempMin = aggregation.min(ttbs.map(ttb => ({ value: ttb.agg.min })));
        $scope.agg.tempMax = aggregation.max(ttbs.map(ttb => ({ value: ttb.agg.max })));
        $scope.agg.tempAvg = aggregation.sum(ttbs.map(ttb => ({ value: ttb.agg.sum }))) / tempCount;
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
        return flags.map(function (flag) {
            var flagObj = {
                name: flag,
                value: true
            };
            attachTo[flag] = flagObj;
            return flagObj;
        });
    }
}]);
