// Constants
const HOST = 'http://localhost:3000';

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
    $scope.statusFlags = buildFlagsAndAttach(['abs_over', 'over_v', 'fullc_v', 'nomc_v', 'undc_v', 'fullb_v'], flatList);
    $scope.extStatusFlags = buildFlagsAndAttach(['over_t', 'nom_t', 'over_p', 'over_i', 'can_error', 'pec_error'], flatList);
    $scope.settingsFlags = buildFlagsAndAttach(['wdog_r', 'mode1', 'mode0', 'raw_temp', 'f1_mctrl', 'f2_mctrl', 'log_data', 'charge'], flatList);
    $scope.ioState = buildFlagsAndAttach(['pe7', 'pe6', 'pe5', 'pe4', 'pa7', 'pa6', 'pa5', 'pa4'], flatList);
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
		$scope.agg.cellSum = aggregation.sum(flatCells);
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
        for (i = 0; i < 12; i++) {
            board = [];
            for (j = 0; j < 12; j++) {
                signal = {
                    name: 'board' + (i + 1) + '_cell' + (j + 1),
                    value: 0
                };
                board.push(signal);
				flatCells.push(signal);
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
				flatTemps.push(signal);
                namedList[signal.name] = signal;
            }
            signal = {
                name: 'board' + (i + 1) + '_vref',
                value: 0
            };
            board.push(signal);
			flatTemps.push(signal);
            namedList[signal.name] = signal;
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
