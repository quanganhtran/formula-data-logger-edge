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
const readline = require('readline');

// Message definition data
var request = {
    id: byteString(REQUEST_DATA_MSG_ID)
};
var status = {
    id: byteString(STATUS_MSG_ID)
};
var status2 = {
    id: byteString(STATUS_MSG_ID + 1)
};
var voltages = [];
for (var board = 0; board < BOARD_COUNT; board++) {
    var msgs = [];
    for (var msg = 0; msg < 3; msg++) {
        var signals = [];
        for (var signal = 0; signal < 4; signal++) {
            signals.push({
                name: 'cell' + (msg * 4 + signal + 1),
                offset: Number(signal * 16).toString()
            });
        }
        msgs.push({
            id: byteString(board * 3 + msg),
            name: 'Cell data of measurement board ' + board,
            signals: signals
        });
    }
    voltages.push({
        messages: msgs
    });
}



function byteString(i) {
    var str = Number(i).toString(16);
    if (str.length < 2) {
        str = '0' + str;
    }
    return '0x' + str;
}