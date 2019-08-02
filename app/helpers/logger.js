const winston = require('winston');
const Helper = require('../helpers/helper.js');
const path = require('path');

let debug_log = path.join(Helper.logsDirectory(), 'debug.log');
let exception_log = path.join(Helper.logsDirectory(), 'exceptions.log');

let my_format = winston.format.printf(({level, message, label, timestamp}) => {
    return `${timestamp} [${level}] - ${message}`;
});

let logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        my_format
    ),
    transports: [
        new winston.transports.File({
            filename: debug_log,
            json: true,
            timestamp: true,
            level: 'error'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: exception_log,
            json: true,
            timestamp: true,
            handleExceptions: true
        })
    ],
    exitOnError: false
});

module.exports = logger;

