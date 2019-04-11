'use strict';

const logger = require('../utils/logger');
const socket = require('../utils/socket');
const WebSocket = require('ws');
const clientMgr = require('./clientMgr');
const roomMgr = require('./roomMgr');
const socket_service = require('./socket_service');
var userMgr = require('../common/userMgr');

const http2 = require('http');
//const http = require('../utils/http');
// const url = require('url');
// const db = require('../utils/db');

const express = require('express');
const app = express();
const port = 10001;
const commandId = 2;

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.use(function (req, res) {
    //let location = url.parse(req.url);
    //let query = req.query;
    //var data = {};

});
const server = http2.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('open', function open() {
    console.log('open');
});
wss.on('close', function close() {
    console.log('close');
});
wss.on('connection', function connection(ws, req) {
    var ip = req.connection.remoteAddress;

    ws.on('message', function incoming(message) {
        message = socket.parse(message);
        if(message == null)return;
        if(message.cmd == "ping"){
            socket.send(ws, 3, "pong");
            return;
        }

        if(message.cmd == 0) {
            ws.userId = message.userId;
            ws.isOnline = true;
            var roomId = roomMgr.getUserRoomId(ws.userId);
            if(roomId == null){
                socket.send(ws, commandId, {cmd: socket.resp.exit_result, result: ws.userId});
                console.log("roomId == null")
                ws.close();
                return;
            }
            var roomInfo = roomMgr.getRoom(roomId);
            if(roomInfo == null){
                socket.send(ws, commandId, {cmd: socket.resp.exit_result, result: ws.userId});console.log("roomInfo == null")
                ws.close();
                return;
            }
            ws.ip = ip;
            ws.gameMgr = roomInfo.gameMgr;
            clientMgr.bind(ws.userId, ws);
            ws.gameType = roomInfo.type;
            userMgr.bind(ws.userId, ws,roomInfo.type);

            socket_service.refresh(ws);
            return;
        }
        socket_service.onMessage(ws,message.cmd,message.msg);
    });
    ws.on('close', function(code, reason) {
        if(code != 1000 || ws.userId == null) {
            console.log("code != 1000 || ws.userId == null",code);
            return;
        }
        clientMgr.clear(ws.userId);
        userMgr.clear(ws.userId, ws.gameType);
        console.log("ws.userId",ws.userId,code, reason);
    });
    ws.on("error", function (error, code) {
        //ws.userId = null;
        console.log(ws.userId,error, code);
    });
});
server.listen(port, function listening() {
    console.log('Listening on %d', server.address().port);
});
//监听异常错误
process.on('uncaughtException', function ( err ) {
    console.log("gameServer " + ' Caught exception: ' + err.stack);
    logger.error_log("gameServer " + ' process.pid: ' + process.pid + ' Caught exception: ' + err.stack );
});