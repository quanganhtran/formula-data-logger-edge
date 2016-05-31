/**
 * Created by Anh on 5/29/2016.
 */
// Configuration constants
const REQUEST_DATA_MSG_ID = 0,
      STATUS_MSG_ID       = REQUEST_DATA_MSG_ID + 2,
      VOLTAGE_MSG_ID      = STATUS_MSG_ID + 4,
      TEMP_MSG_ID         = VOLTAGE_MSG_ID + 36;
const BOARD_COUNT = 12;

// Dependencies
var util = require('util');
var fs = require('fs');
var Mustache = require('mustache');

// Message definition data
var bus = {};
bus.request = {
    id: byteString(REQUEST_DATA_MSG_ID)
};
bus.status = {
    id: byteString(STATUS_MSG_ID)
};
bus.status2 = {
    id: byteString(STATUS_MSG_ID + 1)
};

bus.voltages = createVoltage();
bus.temps = createTemp();

//console.log(util.inspect(bus, false, null));
var template = fs.readFileSync('definition_creator/template.mst', 'utf8');
var rendered = Mustache.render(template, {bus: bus});
fs.writeFileSync('messages.kcd', rendered, 'utf8');
console.log('Definition created successfully');

function byteString(i) {
    var str = Number(i).toString(16);
    if (str.length < 2) {
        str = '0' + str;
    }
    return '0x' + str.toUpperCase();
}

function createVoltage() {
    var voltages = [];
    for (var board = 0; board < BOARD_COUNT; board++) {
        var msgs = [];
        for (var msg = 0; msg < 3; msg++) {
            var prefix = 'board' + (board + 1) + '_';
            var signals = [];
            for (var signal = 0; signal < 4; signal++) {
                signals.push({
                    name: prefix + 'cell' + (msg * 4 + signal + 1),
                    offset: Number(signal * 16).toString()
                });
            }
            msgs.push({
                id: byteString(VOLTAGE_MSG_ID + board * 3 + msg),
                name: 'msgCell_board' + (board + 1) + '_part' + (msg + 1),
                length: '8',
                signals: signals
            });
        }
        voltages.push({
            messages: msgs
        });
    }
    return voltages;
}

function createTemp() {
    var temps = [];
    for (var board = 0; board < BOARD_COUNT; board++) {
        var msgs = [];
        var prefix = 'board' + (board + 1) + '_';
        msgs.push({
            id: byteString(TEMP_MSG_ID + board * 2),
            name: 'msgTemp_board' + (board + 1) + '_part1',
            length: '8',
            signals: [
                {
                    name: prefix + 'temp1',
                    offset: '0'
                },
                {
                    name: prefix + 'temp2',
                    offset: '16'
                },
                {
                    name: prefix + 'temp3',
                    offset: '32'
                },
                {
                    name: prefix + 'temp4',
                    offset: '48'
                }
            ]
        });
        msgs.push({
            id: byteString(TEMP_MSG_ID + board * 2 + 1),
            name: 'msgTemp_board' + (board + 1) + '_part2',
            length: '4',
            signals: [
                {
                    name: prefix + 'temp5',
                    offset: '0'
                },
                {
                    name: prefix + 'vref',
                    offset: '16'
                }
            ]
        });
        temps.push({
            messages: msgs
        });
    }
    return temps;
}