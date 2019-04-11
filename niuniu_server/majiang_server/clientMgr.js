'use strict';

const db = require('../utils/db');
const socket = require('../utils/socket');
const roomMgr = require('./roomMgr');
const userMgr = require('../common/userMgr');

var userList = {};      //保存socket

const commandId = 2;
exports.bind = function(userId,client){
    userList[userId] = client;
    exports.broadcastInRoom(socket.resp.user_state, {userId:userId,online:true}, userId);
};
exports.clear = function(userId){
    delete userList[userId];
    exports.broadcastInRoom(socket.resp.user_state, {userId:userId,online:false}, userId);
};
exports.getUserInfo = function(userId,callback){
    if(userId == "999999"){
        callback({roomCard:999999,coins:999999999});
        return;
    }
    db.get_user_base_info(userId,function (info) {
        callback(info);
    })
};
exports.leaveRoom = function(roomId,index,userId,isDestroy){
    if(isDestroy != true)db.update_seat_info(roomId,index,0,"",0);
    db.update_user_info({userId:userId,oldRoomId:null});
    var type = roomMgr.getRoomType(userId);
    userMgr.userMinus(type);
    delete userList[userId];
};
exports.enterRoom = function(roomId,index,userId,name){
    db.update_seat_info(roomId,index,userId,name,0);
    db.update_user_info({userId:userId,oldRoomId:roomId});
    var type = roomMgr.getRoomType(userId);
    userMgr.userAdd(type);
};

exports.isOnline = function(userId){
    var data = userList[userId];
    if(data != null){
        return true;
    }
    return false;
};

exports.kickAllInRoom = function(roomId){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        //如果不需要发给发送方，则跳过
        if(rs.userId > 0){
            var client = userList[rs.userId];
            if(client != null){
                client.close();
            }
        }
    }
};

exports.sendMsg = function(userId,event,msgData){
    var client = userList[userId];
    if(client == null){
        return;
    }
    socket.send(client, commandId, {cmd: event, result: msgData});
};
exports.broadcastInRoom = function(event,data,sender,includSender){
    var roomId = roomMgr.getUserRoomId(sender);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        //如果不需要发给发送方，则跳过
        if(rs.userId == sender && includSender != true){
            continue;
        }
        var client = userList[rs.userId];
        if(client != null && client.readyState == 1){
            socket.send(client, commandId, {cmd: event, result: data});
        }
    }
}
exports.broadcastInRoom2 = function(event,data,roomId){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        //如果不需要发给发送方，则跳过
        var client = userList[rs.userId];
        if(client != null && client.readyState == 1){
            socket.send(client, commandId, {cmd: event, result: data});
        }
    }
}
