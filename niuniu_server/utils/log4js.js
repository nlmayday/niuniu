var log4js = require('log4js');

var path = require('path');
var serverDir = path.resolve(__dirname, '..');
log4js.configure(
{
    appenders: {
        console: { type: 'console' },
        //all: { type: 'file', filename: './logs/log_all/app.log', maxLogSize: 10458760, backups: 3 },
        error: { type: 'file', filename: serverDir + '/logs/log_error/log_error.log' },
        center:{ type : "dateFile", filename: serverDir + '/logs/center/data' },
        login:{ type : "dateFile", filename: serverDir + '/logs/login/data' },
        hall:{ type : "dateFile", filename: serverDir + '/logs/hall/data' },
        game:{ type : "dateFile", filename: serverDir + '/logs/game/data',
            alwaysIncludePattern : true, pattern : "-yyyy-MM-dd-hh.log" },
        key:{ type : "dateFile", filename: serverDir + '/logs/log_key/data' },
    },
    categories: {
        default: { appenders: [ 'console' ], level: 'all'},
        //"all" :  { appenders: [ 'all' ], level: 'info'},
        "error" :  { appenders: [ 'error' ], level: 'warn'},
        "center" :  { appenders: [ 'center' ], level: 'info'},
        "login" :  { appenders: [ 'login' ], level: 'info'},
        "hall" :  { appenders: [ 'hall' ], level: 'info'},
        "game" :  { appenders: [ 'game' ], level: 'info'},
        "key" :  { appenders: [ 'key' ], level: 'info'},
    }
});

exports.log4js = log4js;

//这是最新写法看官方api