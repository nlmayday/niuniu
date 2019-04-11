'use strict';

var log4js = require('./log4js').log4js;
//const all = log4js.getLogger('all');
const error = log4js.getLogger('error');
const center = log4js.getLogger('center');
const login = log4js.getLogger('login');
const hall = log4js.getLogger('hall');
const game = log4js.getLogger('game');
const key = log4js.getLogger('key');

//exports.all = all;
exports.error = error;
exports.center = center;
exports.login = login;
exports.hall = hall;
exports.game = game;
exports.key = key;

function log(str,style) {
    style = style || styles.black;
    for(let i = 2;i< arguments.length;i++){
        style += arguments[i];
    }
    style += "%s" + styles.nothing;
    console.log(style , str);
}
exports.log = log;

var styles = {
    'nothing'        : '\x1B[0m',
    'bold'            : '\x1B[1m',   //明显的，高亮
    'underline'      : '\x1B[4m',   //下划线
    'inverse'        : '\x1B[7m',   //相反
    'white'          : '\x1B[37m',
    'grey'           : '\x1B[90m',
    'black'          : '\x1B[30m',
    'blue'           : '\x1B[34m',
    'cyan'           : '\x1B[36m',
    'green'          : '\x1B[32m',
    'magenta'        : '\x1B[35m',
    'red'             : '\x1B[31m',
    'yellow'         : '\x1B[33m',
    'whiteBG'        : '\x1B[47m',
    'blackBG'        : '\x1B[40m',
    'blueBG'         : '\x1B[44m',
    'cyanBG'         : '\x1B[46m',
    'greenBG'        : '\x1B[42m',
    'magentaBG'      : '\x1B[45m',
    'redBG'           : '\x1B[41m',
    'yellowBG'       : '\x1B[43m'
};
exports.styles = styles;

exports.error_log = function (str) {
    log(str,styles.redBG);
    error.error(str);
}
exports.center_log = function (str) {
    log(str,styles.cyan);
    center.info(str);
}
exports.login_log = function (str) {
    log(str,styles.green);
    login.info(str);
}
exports.hall_log = function (str) {
    log(str,styles.magenta);
    hall.info(str);
}
exports.game_log = function (str) {
    log(str,styles.yellow);
    game.info(str)
}
exports.key_log = function (str) {
    log(str,styles.greenBG);
    key.info(str);
}