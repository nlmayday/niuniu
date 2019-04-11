'use strict';

//记录用户所有状态
const socket = require('../utils/socket');
const clientMgr = require('../majiang_server/clientMgr');

var userList = {};      //保存socket
var userOnline = {};    //在线人数

exports.bind = function(userId,client,type){
    exports.userAdd(type);
    userList[userId] = client;
};
exports.clear = function(userId,type){
    exports.userMinus(type);
    delete userList[userId];
};

exports.getUserOnline = function(type){
    return userOnline[type];
}
exports.getTotalUsers = function(){
    var count = 0;
    for(var i in userOnline){
        count += userOnline[i];
    }
    return count;
};
exports.userAdd = function(type){
    if(userOnline[type] >= 0){
        userOnline[type] ++;
    }
    else{
        userOnline[type] = 1;
    }
}
exports.userMinus = function(type){
    if(userOnline[type] > 0){
        userOnline[type] --;
    }
    else{
        userOnline[type] = 0;
    }
}
exports.getSocket = function(userId){
    return userList[userId];
};

exports.isOnline = function(userId){
    var data = userList[userId];
    if(data != null){
        return true;
    }
    return false;
};

/*function update() {
    for(var userId in userList) {
        var client = userList[userId];
        if(client.isActive == false){
            client.isOnline = false;
            clientMgr.broadcastInRoom(socket.resp.user_state, {userId:userId,online:false}, userId);
        }
        socket.send(client, 3, "ping");
        client.isActive = false;
    }
}
setInterval( update, 3000 );*/
