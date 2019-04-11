'use strict';

const socket = require('../utils/socket');
const roomMgr = require('./roomMgr');
const clientMgr = require('./clientMgr');

const commandId = 2;

exports.refresh = function(client) {
    var userId = client.userId;
    var roomId = roomMgr.getUserRoomId(userId);
    var roomInfo = roomMgr.getRoom(roomId);
    /*if(roomInfo.numOfGames == 0){
        return;
    }*/
    var seats = [];
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var rs = roomInfo.seats[i];
        var online = 0;
        if (rs.userId > 0) {
            online = clientMgr.isOnline(rs.userId);

            seats[i] = {
                userId: rs.userId,
                ip: rs.ip,
                score: rs.score,
                coins: rs.coins,
                userName: rs.userName,
                online: online,
                ready: rs.ready,
                sit: rs.sit,
                seatIndex: i,
            };
        }
    }

    //通知前端
    var data = {
        roomId: roomInfo.roomId,
        owner:roomInfo.owner,
        conf: roomInfo.conf,
        numofgames: roomInfo.numOfGames,
        seats: seats,
        gameState : roomInfo.gameState,
    };

    socket.send(client, commandId, {cmd: socket.resp.login_result, result: data});

    if(client.gameMgr.syncInfo){
        client.gameMgr.syncInfo(userId);
    }
}
exports.onMessage = function(client,c,msg) {
    if(client.userId == null){
        return;
    }
    if (c == socket.req.login) {
        var userId = client.userId;
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            client.close();
            return;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserIndex(userId);
        roomInfo.seats[seatIndex].ip = client.ip;

        var kickList = client.gameMgr.get_tick_time(userId);
        if (kickList == null) {
            kickList = {};
        }
        var userData = null;
        var seats = [];
        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var rs = roomInfo.seats[i];
            var online = 0;
            if (rs.userId > 0) {
                online = clientMgr.isOnline(rs.userId);

                seats[i] = {
                    userId: rs.userId,
                    ip: rs.ip,
                    score: rs.score,
                    coins: rs.coins,
                    userName: rs.userName,
                    online: online,
                    ready: rs.ready,
                    sit: rs.sit,
                    seatIndex: i,
                    kick_time : kickList[rs.userId]
                };
            }
            if (userId == rs.userId) {
                userData = seats[i];
            }
        }
        //通知前端
		var data = {
            roomId: roomInfo.roomId,
            owner:roomInfo.owner,
			conf: roomInfo.conf,
			numofgames: roomInfo.numOfGames,
			seats: seats,
            gameState : roomInfo.gameState,
		};

        socket.send(client, commandId, {cmd: socket.resp.login_result, result: data});
        //通知其它客户端
        clientMgr.broadcastInRoom2(socket.resp.new_user, userData, roomId);

        if(client.gameMgr.syncInfo){
            client.gameMgr.syncInfo(userId);
        }
    }
    else if (c == socket.req.niuniu) {
        var userId = client.userId;
        if(client.gameMgr)client.gameMgr.setNiuniu(userId);		//为系统兼容用0 1 表示false true
    }
    else if (c == socket.req.ready) {
        var userId = client.userId;
        clientMgr.broadcastInRoom(socket.resp.user_ready,{userId:userId,ready:msg},userId,true);
        if(client.gameMgr)client.gameMgr.setReady(userId,msg);		//为系统兼容用0 1 表示false true
    }
    else if (c == socket.req.sitDown) {
        var userId = client.userId;
        client.gameMgr.sitDown(userId);		//为系统兼容用0 1 表示false true
    }
    else if (c == socket.req.qiangzhuang) {
        var userId = client.userId;
        if((msg >= 0 && msg <= 4) == false){
            console.log("socket.req.qiangzhuang param error");
            return;
        }
        client.gameMgr.qiangzhuang(userId,msg);
    }
    else if (c == socket.req.xiazhu) {
        var userId = client.userId;
        if((msg >= 1 && msg <= 5) == false){
            console.log("socket.req.xiazhu param error");
            return;
        }
        client.gameMgr.xiazhu(userId,msg);
    }
    else if (c == socket.req.kanpai) {
        var userId = client.userId;
        client.gameMgr.kanpai(userId);
    }
    else if (c == socket.req.liangpai) {
        var userId = client.userId;
        client.gameMgr.liangpai(userId);
    }
    else if (c == socket.req.dingque) {
        var userId = client.userId;
        if(msg != 0 && msg != 1 && msg != 2){
            console.log("socket.req.dingque param error");
            return;
        }
        client.gameMgr.setDingque(userId,msg);
    }
    else if (c == socket.req.tianTing) {
        var userId = client.userId;
        client.gameMgr.reqTianTing(userId);
    }
    else if (c == socket.req.chupai) {
        var pai = msg;
        client.gameMgr.chuPai(client.userId,pai);
    }
    else if (c == socket.req.chi) {
        var index = msg;
        client.gameMgr.chi(client.userId,index);
    }
    else if (c == socket.req.peng) {
        client.gameMgr.peng(client.userId);
    }
    else if (c == socket.req.gang) {
        var pai = msg;
        client.gameMgr.gang(client.userId,pai);
    }
    else if (c == socket.req.hu) {
        client.gameMgr.hu(client.userId);
    }
    else if (c == socket.req.guo) {
        client.gameMgr.guo(client.userId);
    }

    else if (c == socket.req.exit) {
        var userId = client.userId;
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            return;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserIndex(userId);
        //如果游戏已经开始，则不可以
        if(client.gameMgr.hasBegan(roomId) && roomInfo.seats[seatIndex].sit == 1){
            if(client.gameMgr.exitAfterEnd(roomInfo,seatIndex))return;
        }
        //如果是房主，则只能走解散房间
        if(roomMgr.isCreator(userId)){
            return;
        }
        socket.send(client, commandId, {cmd: socket.resp.exit_result, result: userId});
        //通知其它玩家，有人退出了房间
        clientMgr.broadcastInRoom(socket.resp.exit_notify,userId,userId,false);

        roomMgr.exitRoom(userId);
        client.close();
    }
    else if (c == socket.req.dispress) {
        var userId = client.userId;
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            return;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        var seatIndex = roomMgr.getUserIndex(userId);
        //如果游戏已经开始，则不可以
        if(client.gameMgr.hasBegan(roomId)){
            return;
        }
        //如果不是房主，则不能解散房间
        if(roomMgr.isCreator(roomId,userId) == false){
            return;
        }
        clientMgr.broadcastInRoom(socket.resp.dispress,"dispress",userId,true);
        clientMgr.kickAllInRoom(roomId);
        roomMgr.destroy(roomId);
    }
    else if (c == socket.req.dissolve_request) {
        var userId = client.userId;
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            return;
        }
        var ret = client.gameMgr.dissolveRequest(roomId,userId);
        if(ret != null){
            var dr = ret.dr;
            var delayTime = (dr.endTime - Date.now()) / 1000;
            var data = {
                delayTime:delayTime,
                states:dr.states
            }
            clientMgr.broadcastInRoom(socket.resp.dissolve_notice,data,userId,true);
        }
    }
    else if (c == socket.req.dissolve_agree) {
        var userId = client.userId;
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            return;
        }
        var ret = client.gameMgr.dissolveAgree(roomId,userId,true);
        if(ret != null){
            var dr = ret.dr;
            var delayTime = (dr.endTime - Date.now()) / 1000;
            var data = {
                delayTime:delayTime,
                states:dr.states
            }
            clientMgr.broadcastInRoom(socket.resp.dissolve_notice,data,userId,true);

            var doAllAgree = true;
            for(var i = 0; i < dr.states.length; ++i){
                if(dr.states[i] == false){
                    doAllAgree = false;
                    break;
                }
            }
            if(doAllAgree){
                client.gameMgr.doDissolve(roomId);
            }
        }
    }
    else if (c == socket.req.dissolve_reject) {
        var userId = client.userId;
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            return;
        }
        var ret = client.gameMgr.dissolveAgree(roomId,userId,false);
        if(ret != null){
            clientMgr.broadcastInRoom(socket.resp.dissolve_cancel,"",userId,true);
        }
    }
    else if (c == socket.req.chat) {
        var chatContent = msg;
        clientMgr.broadcastInRoom(socket.resp.chat,{sender:client.userId,content:chatContent},client.userId,true);
    }
    else if (c == socket.req.quick_chat) {
        var chatId = msg;
        clientMgr.broadcastInRoom(socket.resp.quick_chat,{sender:client.userId,content:chatId},client.userId,true);
    }
    else if (c == socket.req.emoji) {
        var emojiName = msg;
        clientMgr.broadcastInRoom(socket.resp.emoji,{sender:client.userId,content:emojiName},client.userId,true);
    }
    else if (c == socket.req.voice) {
        clientMgr.broadcastInRoom(socket.resp.voice,{sender:client.userId,content:msg},client.userId,true);
    }
    else if (c == socket.req.magic) {
        var receiver = msg.userId;
        var content = msg.content;
        if(receiver == client.userId){
            var roomId = roomMgr.getUserRoomId(client.userId);
            if(roomId == null){
                return;
            }
            var roomInfo = roomMgr.getRoom(roomId);
            if(roomInfo == null){
                return;
            }
            for(var i = 0; i < roomInfo.seats.length; ++i){
                var rs = roomInfo.seats[i];
                if(rs.userId > 0 && rs.userId != client.userId){
                    clientMgr.broadcastInRoom(socket.resp.magic,{sender:client.userId,receiver:rs.userId,content:content},client.userId,true);
                }
            }
        }
        else{
            clientMgr.broadcastInRoom(socket.resp.magic,{sender:client.userId,receiver:receiver,content:content},client.userId,true);
        }
    }
}

