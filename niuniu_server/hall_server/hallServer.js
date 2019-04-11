'use strict';

const express = require('express');
var path = require('path');
const http2 = require('http');
const http = require('../utils/http');
var logger = require('../utils/logger');
var socket = require('../utils/socket');
const crypto = require('../utils/crypto');
const db = require('../utils/db');
const config = require('../common/config');
var WebSocket = require('ws');
const url = require('url');

var roomConf = require('../majiang_server/roomConf');
var roomMgr = require('../majiang_server/roomMgr');
var userMgr = require('../common/userMgr');

var app = express();
const port = 9001;
const commandId = 1;

var rooms_public = {};      //存放所有公开房间
var user_all = {};          //所有玩家
var rooms_users = {};       //创建页面玩家
var union_all = {};         //所有公会基本信息

//var serverDir = path.resolve(__dirname, '..');

var servers = config.servers;
var hall = servers.hall_game;
var config_servers = hall.servers;

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
    let location = url.parse(req.url);
    let query = req.query;
    var errcode = 0;
    var data = {};
    if(location.pathname == "/getUserBaseInfo"){
        if(query.userId == "999999"){
            http.send(res,errcode,{userName:"系统",sex:0});
            return;
        }
        db.get_user_base_info(query.userId,function (info) {
            if(info == null){
                errcode = 301;
            }
            else{
                data = {userName:info.userName,sex:info.sex,headImg:info.headImg};
            }
            http.send(res,errcode,data);
        });
    }
    else if(location.pathname == "/onlineInfo"){
        data = [];
        var userList = userMgr.getOnlineAll();
        for(var user in userList){
            data.push(user);
        }
        http.send(res,errcode,data);
    }
    else if(location.pathname == "/niuniuInfo"){
        db.niuniu_permission(query.userId,function (code) {
            data.niuniu = code == 0;
            db.get_user_base_info(query.userId,function (ret) {
                if(ret)data.coins = ret.coins;
                http.send(res,errcode,data);
            });
        });
    }
    else if(location.pathname == "/setNiuniu"){
        db.set_niuniu_permission(query.userId,query.niuniu == 0?false:true,function (code) {
            http.send(res,code);
        });
    }
    else{
        http.send(res,errcode,data);
    }
});
const server = http2.createServer(app);
const wss = new WebSocket.Server({ server });
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        socket.send(client,commandId,data);
    });
};
wss.on('open', function open() {
    console.log('open');
});
wss.on('close', function close() {
    console.log('close');
});
wss.on('connection', function connection(ws, req) {
    //const location = url.parse(req.url, true);
    //ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for']  //不可全信请求头
    const ip = req.connection.remoteAddress;

    ws.on('message', function incoming(message) {
        message = socket.parse(message);
        if(message == null){
            console.warn("message can't be null");
            return;
        }
        if(message.cmd == "ping"){
            socket.send(ws, 3, "pong");
            return;
        }
        /*if(message.cmd == "pong"){
            ws.isActive = true;
            return;
        }*/
        if(message.cmd == 0) {
            ws.userId = message.userId;
            ws.area = message.area;
            user_all[ws.userId] = ws;
            userMgr.bind(ws.userId, ws,"hall");
            return;
        }
        onMessage(ws,message.cmd,message.msg);
    });
    ws.on('close', function(code, reason) {
        if(code != 1000 || ws.userId == null) {
            console.log("code != 1000 || ws.userId == null",code);
            return;
        }
        var userId = ws.userId;
        if(user_all[userId]){
            delete user_all[userId];
        }
        if(rooms_users[userId]) {
            delete rooms_users[userId];
        }
        userMgr.clear(ws.userId,"hall");
    });
    ws.on("error", function (error, code) {
        //ws.userId = null;
        console.log(ws.userId,error, code)
    });
});
server.listen(port, function listening() {
    console.log('Listening on %d', server.address().port);
});

function broadcast (users,data) {
    for(var userId in users){
        var client = user_all[userId];
        socket.send(client,commandId,data);
    }
}
exports.delete_room = function (roomId) {
    if(rooms_public[roomId]){
        delete rooms_public[roomId];
        broadcast(rooms_users,{cmd: socket.resp.roomsList_refresh, result: {roomId:roomId,state:"delete"}});
    }
}
exports.setStart = function (roomId) {
    if(rooms_public[roomId]){
        broadcast(rooms_users,{cmd: socket.resp.roomsList_refresh, result: {roomId:roomId,state:"playing"}});
    }
}
exports.roomStateChange = function  (roomId,roomInfo) {
    if (rooms_public[roomId]) {
        var numOfPlayers = 0;
        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var userId = roomInfo.seats[i].userId;
            if (userId > 0) {
                numOfPlayers++;
            }
        }
        var room = {roomId: roomId, numOfPlayers: numOfPlayers};
        broadcast(rooms_users, {cmd: socket.resp.roomsList_refresh, result: room});

        if(roomInfo.conf.maxGames <= 0 && (numOfPlayers == 0 || numOfPlayers == roomInfo.conf.roomNum)){
            var difen = transIndex(roomInfo.conf.difen);
            var needCreate = true;
            for(var j=0;j<rooms_idle[difen].length;j++){
                var roomInfo2 = rooms_idle[difen][j];
                if(roomInfo2 == roomInfo){
                    continue;
                }
                var numOfPlayers2 = 0;
                for (var i = 0; i < roomInfo2.seats.length; ++i) {
                    var userId = roomInfo2.seats[i].userId;
                    if (userId > 0) {
                        numOfPlayers2++;
                    }
                }
                if(numOfPlayers2 == numOfPlayers && numOfPlayers == 0){
                    rooms_idle[difen].splice(j,1);
                    roomMgr.destroy(roomInfo2.roomId);
                    return;
                }
                if(numOfPlayers2 < numOfPlayers){
                    needCreate = false;
                }
            }
            if(numOfPlayers == roomInfo.conf.roomNum && needCreate){
                createRoomPublic(difen);
            }
        }
    }
}

function onMessage(client,c,msg){
    var cmd;
    if(client.userId == null){
        return;
    }
    if(msg == null){
        msg = {};
    }
    if(c == socket.req.getRoomConfig) {
        cmd = socket.resp.getRoomConfig_resp;
        var config = roomConf.getConfig(msg.type);
        if(config == null)config = [{}];
        var str = crypto.toBase64(JSON.stringify(config));
        socket.send(client, commandId, {cmd: cmd, result: str});
    }
    else if(c == socket.req.create_room) {
        cmd = socket.resp.create_room_resp;
        var data = {};
        var url = config_servers.url;
        var conf = JSON.stringify(msg.conf);

        roomMgr.createRoom(client.userId,conf,function (errcode,roomId,roomInfo) {
            if(errcode == 0){
                data.roomId = roomId;
                if(roomInfo && roomInfo.conf.simi != 1){
                    rooms_public[roomId] = roomInfo;
                    var room = {roomId: roomId, new: true};
                    room.difen = roomInfo.conf.difen;
                    room.maxGames = roomInfo.conf.maxGames;
                    room.condition = roomInfo.conf.condition;
                    broadcast(rooms_users, {cmd: socket.resp.roomsList_refresh, result: room});
                }
            }
            else{
                data.errcode = errcode;
            }
            socket.send(client, commandId, {cmd: cmd, result: data});
        },url);
    }
    else if(c == socket.req.enter_private_room) {
        cmd = socket.resp.enter_private_room_resp;
        roomMgr.enterRoom(msg,client.userId,client.area,function (errcode) {
            var data = {};
            data.url = config_servers.url;
            if(errcode != 0){
                data.errcode = errcode;
            }
            socket.send(client, commandId, {cmd: cmd, result: data});
        });
    }
    else if(c == socket.req.enter_public_room) {
        cmd = socket.resp.enter_public_room_resp;
        var data = {};
        data.url = config_servers.url;
    }
    else if(c == socket.req.getRoomsList) {
        cmd = socket.resp.getRoomsList_resp;
        var data = [];
        for(var roomId in rooms_public){
            var roomInfo = rooms_public[roomId];
            var room = {};
            room.roomId = roomInfo.roomId;
            room.difen = roomInfo.conf.difen;
            room.maxGames = roomInfo.conf.maxGames;
            room.condition = roomInfo.conf.condition;
            if(roomInfo.numOfGames > 0){
                room.state = "playing";
            }
            var numOfPlayers = 0;
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var userId = roomInfo.seats[i].userId;
                if (userId > 0) {
                    numOfPlayers++;
                }
            }
            room.numOfPlayers = numOfPlayers;
            data.push(room);
        }
        rooms_users[client.userId] = client;
        socket.send(client, commandId, {cmd: cmd, result: data});
    }
    else if(c == socket.req.leave_roomList) {
        var userId = client.userId;
        if(rooms_users[userId]){
            delete  rooms_users[userId];
        }
    }
    else if(c == socket.req.getNotify) {
        cmd = socket.resp.getNotify_resp;
        var area = msg;
        var data = "";
        db.get_notify(function (ret) {
            for (var i = 0; i < ret.length; i++) {
                if (ret[i].type == area) {
                    var msg2 = ret[i].msg;
                    data = crypto.toBase64(msg2);
                    socket.send(client, commandId, {cmd: cmd, result: data});
                    return;
                }
            }
        });
        var userId = client.userId;
        db.get_user_base_info(userId,function (ret) {
            if(ret){
                delete ret.userName;
                socket.send(client, commandId, {cmd: socket.resp.money_change, result: ret});
            }
        });
    }
    else if(c == socket.req.save_money) {
        cmd = socket.resp.money_change;
        var money = msg;
        db.save_money(client.userId, client.area,money,function (ret) {
            socket.send(client, commandId, {cmd: cmd, result: ret});
        });
    }
    else if(c == socket.req.takeOut_money) {
        cmd = socket.resp.money_change;
        var money = msg;
        db.takeOut_money(client.userId, client.area,money,function (ret) {
            socket.send(client, commandId, {cmd: cmd, result: ret});
        });
    }
    else if(c == socket.req.create_union) {
        cmd = socket.resp.create_union_resp;
        var unionName = crypto.fromBase64(msg.unionName);
        var name = crypto.fromBase64(msg.name);
        var phone = msg.phone;
        var wechatId = msg.wechatId;
        var data = {area:client.area,userId:client.userId,name:name,unionName:unionName,phone:phone,wechatId:wechatId};

        db.create_union_apply(data,function (code) {
            if(code == 0){
                socket.send(client, commandId, {cmd: cmd, result: {}});
            }
            else if(code == 1){          //已经申请过公会了
                socket.send(client, commandId, {cmd: cmd, result: {errcode:420}});
            }
        });
    }
    else if(c == socket.req.join_union) {
        var unionId = msg;
        if(unionId && client.area){
            db.join_union(client.userId,unionId, client.area,function (code) {
                if(code == 0){
                    var cmd2 = socket.resp.union_change;
                    socket.send(client, commandId, {cmd: cmd2, result: {unionId:unionId}});
                }
            });
        }
    }
    else if(c == socket.req.exit_union) {
        var unionId = msg;
        if(unionId && client.area){
            db.exit_union(client.userId,unionId, client.area);
        }
    }
    else if(c == socket.req.get_unionInfo) {
        cmd = socket.resp.get_unionInfo_resp;
        var unionId = msg;
        if(unionId){
            db.get_unionInfo(unionId, client.area,function (code,ret) {
                if (code == 0) {
                    var data = ret;
                    data.name = crypto.toBase64(ret.name);
                    data.notify = crypto.toBase64(ret.notify);
                    if(union_all[unionId] == null)union_all[unionId] = data;
                    socket.send(client, commandId, {cmd: cmd, result: data});
                }
                else if(code == 1){
                    socket.send(client, commandId, {cmd: cmd, result: {errcode:421}});
                }
            });
        }
    }
    else if(c == socket.req.apply_coin) {
        var unionId = msg.unionId;
        var coins = msg.coins;
        if(unionId && coins) {
            db.apply_coin(client.userId, unionId, client.area, coins);
        }
    }
    else if(c == socket.req.offer_coin) {
        var unionId = msg.unionId;
        var coins = msg.coins;
        if(unionId && coins){
            var cmd = socket.resp.money_change;
            db.cost_coins(client.userId, {area:client.area},coins,function (ret) {
                socket.send(client, commandId, {cmd: cmd, result: ret});
                var cmd2 = socket.resp.unoin_coins_change;
                db.offer_coins(client.userId,unionId, client.area,coins,function (ret) {
                    socket.send(client, commandId, {cmd: cmd2, result: ret});
                });
            });
        }
    }
    else if(c == socket.req.apply_record) {
        cmd = socket.resp.apply_record_resp;
        var unionId = msg;
        if(unionId){
            db.get_record(client.userId,unionId, client.area,1,function (ret) {
                var data = [];
                if(ret && ret.length > 0){
                    for(var i=0;i<ret.length;i++){
                        ret[i].memberName = crypto.toBase64(ret[i].memberName);
                    }
                    data = ret;
                }
                console.log(data);
                socket.send(client, commandId, {cmd: cmd, result: data});
            });
        }

    }
    else if(c == socket.req.offer_record) {
        cmd = socket.resp.offer_record_resp;
        var unionId = msg;
        if(unionId) {
            db.get_record(client.userId, unionId, client.area, 2, function (ret) {
                var data = [];
                if(ret && ret.length > 0){
                    for(var i=0;i<ret.length;i++){
                        ret[i].memberName = crypto.toBase64(ret[i].memberName);
                    }
                    data = ret;
                }
                socket.send(client, commandId, {cmd: cmd, result: data});
            });
        }
    }
    else if(c == socket.req.join_list) {
        cmd = socket.resp.join_list_resp;
        var unionId = msg;
        db.get_record_apply(unionId, client.area,4,function (ret) {
            var data = [];
            if(ret && ret.length > 0){
                for(var i=0;i<ret.length;i++){
                    ret[i].memberName = crypto.toBase64(ret[i].memberName);
                }
                data = ret;
            }
            socket.send(client, commandId, {cmd: cmd, result: ret});
        });
    }
    else if(c == socket.req.apply_list) {
        cmd = socket.resp.apply_list_resp;
        var unionId = msg;
        db.get_record_apply(unionId, client.area,1,function (ret) {
            var data = [];
            if(ret && ret.length > 0){
                for(var i=0;i<ret.length;i++){
                    ret[i].memberName = crypto.toBase64(ret[i].memberName);
                }
                data = ret;
            }
            socket.send(client, commandId, {cmd: cmd, result: data});
        });
    }
    else if(c == socket.req.apply_record_all) {
        cmd = socket.resp.apply_record_all_resp;
        var unionId = msg;
        db.get_record_all(unionId, client.area,1,function (ret) {
            var data = [];
            if(ret && ret.length > 0){
                for(var i=0;i<ret.length;i++){
                    ret[i].memberName = crypto.toBase64(ret[i].memberName);
                }
                data = ret;
            }
            socket.send(client, commandId, {cmd: cmd, result: data});
        });
    }
    else if(c == socket.req.offer_record_all) {
        cmd = socket.resp.offer_record_all_resp;
        var unionId = msg;
        db.get_record_all(unionId, client.area,2,function (ret) {
            var data = [];
            if(ret && ret.length > 0){
                for(var i=0;i<ret.length;i++){
                    ret[i].memberName = crypto.toBase64(ret[i].memberName);
                }
                data = ret;
            }
            socket.send(client, commandId, {cmd: cmd, result: data});
        });
    }
    else if(c == socket.req.member_list) {
        cmd = socket.resp.member_list_resp;
        var unionId = msg;
        db.get_member_list(unionId, client.area,function (ret) {
            socket.send(client, commandId, {cmd: cmd, result: ret});
        });
    }
    else if(c == socket.req.award_count) {
        cmd = socket.resp.award_count_resp;
        var unionId = msg;
        db.get_award_count(unionId, client.area,function (ret) {
            var data = ret;
            socket.send(client, commandId, {cmd: cmd, result: data});
        });
    }
    else if(c == socket.req.award_coin) {
        cmd = socket.resp.award_coin_resp;
        var unionId = msg;
        db.award_coin(unionId, client.area,function (code,count) {
            if(code == 0){
                var data = count;
                socket.send(client, commandId, {cmd: cmd, result: data});
            }
        });
    }
    else if(c == socket.req.award_coin_list) {
        cmd = socket.resp.award_coin_list_resp;
        var unionId = msg;
        db.get_record_all(unionId, client.area,3,function (ret) {
            var data = [];
            if(ret && ret.length > 0){
                for(var i=0;i<ret.length;i++){
                    ret[i].memberName = crypto.toBase64(ret[i].memberName);
                }
                data = ret;
            }
            socket.send(client, commandId, {cmd: cmd, result: data});
        });
    }
    else if(c == socket.req.dealDoudou) {
        var unionId = msg.unionId;
        var id = msg.id;
        var isAgree = msg.result == 1;
        db.dealDoudou(unionId,client.userId,client.area, id,isAgree,function (code,ret) {
            var cmd1 = socket.resp.dealDoudou_resp;
            if(code == 0){
                var userId = ret.userId;
                var coins = ret.coins;
                var cmd2 = socket.resp.money_change;
                var client2 = user_all[userId];
                if(client2){
                    socket.send(client2, commandId, {cmd: cmd2, result: {coins:coins}});
                }

                var cmd3 = socket.resp.unoin_coins_change;
                socket.send(client, commandId, {cmd: cmd3, result: ret.unoinCoins});
                socket.send(client2, commandId, {cmd: cmd3, result: ret.unoinCoins});
            }
            socket.send(client, commandId, {cmd: cmd1, result: code});
        });

    }
    else if(c == socket.req.dealJoin) {
        var unionId = msg.unionId;
        var id = msg.id;
        var isAgree = msg.result == 1;
        db.dealJoin(unionId,client.userId,client.area, id,isAgree,function (code,ret) {
            var cmd1 = socket.resp.dealJoin_resp;
            if(code == 0){
                var userId = ret.userId;
                var cmd2 = socket.resp.union_change;
                var client2 = user_all[userId];
                if(client2){
                    socket.send(client2, commandId, {cmd: cmd2, result: {unionId:unionId}});
                }
            }
            socket.send(client, commandId, {cmd: cmd1, result: code});
        });
    }
    else if(c == socket.req.setManager) {
        var unionId = msg.unionId;
        var userId = msg.userId;
        var isAgree = msg.result == 1;
        db.setManager(unionId,client.userId,client.area, userId,isAgree);
    }
}

process.on('uncaughtException', function ( err ) {
    console.log("hallServer " + ' Caught exception: ' + err.stack);
    logger.error_log("hallServer " + ' process.pid: ' + process.pid + ' Caught exception: ' + err.stack );
});


var rooms_idle = [[],[],[],[],[],[],[],[],[]];      //存放所有公开房间
// 创建空房间
setTimeout(function () {
    var difens = [0,1,2,3,4,5,6,7,8];
    for (var k = 0; k < difens.length; k++) {
        createRoomPublic(difens[k]);
    }
},3000);
function createRoomPublic(difen){
    var url = config_servers.url;
    var conf = {
        type: "wd_nn",
        maxGames: 2,
        roomNum: 1,
        difen: difen + 1,
        condition: 1,
        simi: 0,
        wanfa: 1
    };
    var confStr = JSON.stringify(conf);
    roomMgr.createRoom("999999", confStr, function (errcode, roomId, roomInfo) {
        if (errcode == 0) {
            if (roomInfo && roomInfo.conf.simi != 1) {
                rooms_public[roomId] = roomInfo;
                rooms_idle[difen].push(roomInfo);
            }
        }
    }, url);
}

function transIndex(value) {
    var difen = [5,10,20,30,50,100,200,300,500];
    for(var i=0;i<difen.length;i++){
        if(value == difen[i]){
            return i;
        }
    }
}
/*
function update() {
    for(var roomId1 in rooms_idle){
        var info = rooms_idle[roomId1];
        var conf = info.conf;
        if(info.numOfGames > 0){
            var url = config_servers.url;
            var conf2 = {
                type : "wd_nn",
                maxGames: 1,
                roomNum: 1,
                difen: transIndex(conf.difen)+1,
                condition : 1,
                simi: 0,
                wanfa: 1
            };
            var confStr = JSON.stringify(conf2);
            delete rooms_idle[roomId1];
            roomMgr.createRoom("999999",confStr,function (errcode,roomId,roomInfo) {
                if(errcode == 0){
                    if(roomInfo && roomInfo.conf.simi != 1){
                        rooms_public[roomId] = roomInfo;
                        rooms_idle[roomId] = roomInfo;
                        var room = {roomId: roomId, new: true};
                        room.type = roomInfo.type;
                        room.difen = roomInfo.conf.difen;
                        room.maxGames = roomInfo.conf.maxGames;
                        room.roomNum = roomInfo.conf.roomNum;
                        room.condition = roomInfo.conf.condition;
                        broadcast(rooms_users, {cmd: socket.resp.roomsList_refresh, result: room});
                    }
                }
            },url);
        }
    }
}
setInterval( update, 3000 );
*/