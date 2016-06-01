/**
 * Created by Anh on 5/29/2016.
 */
// Configuration constants
const CAN_ID_START      = 0,
      CAN_ID_REQ_STAT   = CAN_ID_START,
      CAN_ID_STAT       = CAN_ID_START + 1,
      CAN_ID_STAT_2     = CAN_ID_REQ_STAT + 2,
      CAN_ID_VOLT       = CAN_ID_START + 6,
      CAN_ID_TEMP       = CAN_ID_VOLT + 36;
const BOARD_COUNT = 12;

// Dependencies
var util = require('util');
var fs = require('fs');
var Mustache = require('mustache');

// Message definition data
var bus = {};
bus.request = {
    id: byteString(CAN_ID_REQ_STAT)
};
bus.status = {
    id: byteString(CAN_ID_STAT),
    status_flags: createStatusByte(16, ['abs_over', 'over_v', 'fullc_v', 'nomc_v', 'undc_v', 'fullb_v']),
    ext_status_flags: createStatusByte(24, ['over_t', 'nom_t', 'over_p', 'over_i', 'can_error', 'pec_error']),
    settings_flags: createStatusByte(32, ['wdog_r', 'mode1', 'mode0', 'raw_temp', 'f1_mctrl', 'f2_mctrl', 'log_data', 'charge']),
    io_state: createStatusByte(56, ['pe7', 'pe6', 'pe5', 'pe4', 'pa7', 'pa6', 'pa5', 'pa4'])
};
bus.status2 = {
    id: byteString(CAN_ID_STAT_2)
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
                id: byteString(CAN_ID_VOLT + board * 3 + msg),
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
            id: byteString(CAN_ID_TEMP + board * 2),
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
            id: byteString(CAN_ID_TEMP + board * 2 + 1),
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

function createStatusByte(offset, flags) {
    return flags.map(function (flag) {
        var flagObj = {
            name: flag,
            offset: offset
        };
        offset++;
        return flagObj;
    })
}