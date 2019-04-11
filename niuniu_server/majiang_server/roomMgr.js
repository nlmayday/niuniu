"use strict";
const db = require('../utils/db');
const clientMgr = require('./clientMgr');
const roomConf = require('./roomConf');
const crypto = require('../utils/crypto');
const hallServer = require('../hall_server/hallServer');

var gl_mj = require( './games/gl_mj' );
var gy_mj = require( './games/gy_mj' );
var wd_nn = require( './games/wd_nn' );

var gameMgr = {};
gameMgr.gl_mj = gl_mj;
gameMgr.gy_mj = gy_mj;
gameMgr.wd_nn = wd_nn;
var rooms = {};
var creatingRooms = {};
var disRoom = {};           //所有未解散房间定时器
var roomsCount = {};

var userLocation = {};

function generateRoomId(){
	var roomId = "";
	for(var i = 0; i < 6; ++i){
		roomId += Math.floor(Math.random()*10);
	}
	return roomId;
}

exports.createRoom = function(creator,conf,callback,url){
    if(creator == null){
        console.error("createRoom creator",creator);
        return;
    }
	var config = roomConf.parse(conf);
	if(config == null){
		callback(401,null);
		return;
	}

    var roomId = generateRoomId();
    if(rooms[roomId] != null || creatingRooms[roomId] != null){
        return;
    }

    clientMgr.getUserInfo(creator,function (info) {
        if(info == null){
            console.log(22222222222);
            return;
        }
        if (config.cost && config.cost > info.roomCard) {
            callback(406);
            return;
        }
        if (config.condition && config.condition > info.coins) {
            callback(407);
            return;
        }
        creatingRooms[roomId] = true;
        var createTime = Date.now();
        var roomInfo = {
            roomId:roomId,
            type:config.type,
            owner:creator,
            numOfGames:0,
            createTime:createTime,
            seats:[],
            conf:config,
            url : url
        };
        var fnCreate = function(roomInfo2){
            roomInfo2.gameMgr = gameMgr[roomInfo2.conf.type];
            if(roomInfo2.gameMgr == null){
                callback(402,null);
                return 402;
            }
            for(var i = 0; i < roomInfo2.conf.roomNum; ++i) {
                roomInfo2.seats.push({
                    userId:0,
                    area : "",
                    score:0,
                    coins:0,
                    userName:"",
                    sit:0,
                    ready:0,
                    seatIndex:i,

                    numZiMo:0,
                    numJiePao:0,
                    numDianPao:0,
                    numAnGang:0,
                    numMingGang:0,
                });
            }
        }
        //写入数据库
        db.create_room(roomInfo,function(ret){
            delete creatingRooms[roomId];
            if(ret){
                fnCreate(roomInfo);
                roomAdd(roomInfo.conf.type);
                rooms[roomId] = roomInfo;
                callback(0,roomId,roomInfo);
            }
            else{
                callback(403,null);
            }
        });
    });

};

exports.destroy = function(roomId){
	if( disRoom[ roomId ] ) {
		//删除定时任务
		clearTimeout( disRoom[ roomId ] );
		delete disRoom[ roomId ];
	}
	var roomInfo = rooms[roomId];
    if(roomInfo == null)return;
	for(var i = 0; i < roomInfo.conf.roomNum; ++i){
		var userId = roomInfo.seats[i].userId;
		if(userId > 0){
			delete userLocation[userId];
            clientMgr.leaveRoom(roomId,i,userId,true);
		}
	}
	roomMinus(roomInfo.conf.type);
	delete rooms[roomId];
	db.delete_room(roomId);
    hallServer.delete_room(roomId);
};

exports.enterRoom = function(roomId,userId,area,callback){
	var fnTakeSeat = function(room,cb){
		if(exports.getUserRoomId(userId)){
			//已存在
            cb(0);
			return;
		}
		for(var i = 0; i < room.conf.roomNum; ++i) {
			var seat = room.seats[i];
			if(seat.userId <= 0){
                clientMgr.getUserInfo(userId,function (info) {
                    if(info == null)return;
				    if(room.conf.cost && room.conf.cost > info.roomCard){
                        cb(406);
                        return;
                    }
                    if(room.conf.condition && room.conf.condition > info.coins){
                        cb(407);
                        return;
                    }
                    if(seat.userId > 0){
                        cb(408);
                        return;
                    }
                    seat.userId = userId;
                    seat.area = area;
                    userLocation[userId] = {
                        type : room.conf.type,
                        roomId:roomId,
                        seatIndex:i
                    };
                    seat.userName = crypto.toBase64(info.userName);
                    seat.coins = info.coins;
                    clientMgr.enterRoom(roomId,i,seat.userId,info.userName);
                    disRoomStop(roomId);

                    roomStateChange(roomId,room);
                    //正常
                    cb(0);

                });
				return;
			}
		}	
		//房间已满
        cb(405);
	};
	var room = rooms[roomId];
	if( room ){
		var ret = fnTakeSeat(room,callback);
	}
	else{
        callback(404);
    }
};

exports.exitRoom = function(userId){
    var location = userLocation[userId];
    if(location == null)
        return;

    var roomId = location.roomId;
    var seatIndex = location.seatIndex;
    var room = rooms[roomId];

    var seat = room.seats[seatIndex];
    seat.userId = 0;
    seat.area = "";
    seat.userName = "";
    seat.ready = 0;
    seat.sit = 0;

    delete userLocation[userId];
    clientMgr.leaveRoom(roomId,seatIndex,userId);
    roomStateChange(roomId,room);
};

exports.setStart = function (roomId) {
    //展示房间状态
    hallServer.setStart(roomId);
}
function roomStateChange (roomId,roomInfo) {
    var numOfPlayers = 0;
    var isBegin = true;
    var count = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
    	var userId = roomInfo.seats[i].userId;
        if(userId > 0 && clientMgr.isOnline(userId)){
            numOfPlayers++;
        }
        if(userId > 0 && roomInfo.seats[i].ready == false){
            isBegin = false;
        }
        else if(userId > 0)count += 1;
    }
    //长时间没人上线解散房间
    if( numOfPlayers == 0  && roomInfo.owner != "999999"){
        disRoomStart(roomInfo.roomId);
    }
    if(isBegin && count > 1 && roomInfo.gameMgr && roomInfo.owner != "999999"){
        roomInfo.gameMgr.gameBegin(roomInfo);
    }
    if(roomInfo){
        //展示房间状态
        hallServer.roomStateChange(roomId,roomInfo);
    }
}
exports.getRoomsCount = function(type){
	return roomsCount[type];
}
exports.getTotalRooms = function(){
	var count = 0;
	for(i in roomsCount){
        count += roomsCount[i];
	}
    return count;
};
function roomAdd(type){
	if(roomsCount[type] >= 0){
        roomsCount[type] ++;
	}
	else{
        roomsCount[type] = 1;
	}
}
function roomMinus(type){
    if(roomsCount[type] > 0){
        roomsCount[type] --;
    }
    else{
        roomsCount[type] = 0;
    }
}
exports.getRoom = function(roomId){
    return rooms[roomId];
};

exports.getUserRoomId = function(userId){
	var location = userLocation[userId];
	if(location != null){
		return location.roomId;
	}
	return null;
};
exports.getUserIndex = function(userId){
    var location = userLocation[userId];
    if(location != null){
        return location.seatIndex;
    }
    return null;
};
exports.getRoomType = function(userId){
    var location = userLocation[userId];
    if(location != null){
        return location.type;
    }
    return null;
};
exports.isCreator = function(roomId,userId){
    var roomInfo = rooms[roomId];
    if(roomInfo == null){
        return false;
    }
    return roomInfo.owner == userId;
};
function disRoomStart ( roomId ) {
	if( disRoom[ roomId ] ) {
        clearTimeout( disRoom[ roomId ] );
    }
    //所有人都已经下线，增加定时任务，1小时没人上线，删除房间 3600 * 1000
    disRoom[ roomId ] = setTimeout( function(){
        exports.destroy( roomId );
    }, 3600 * 1000 );
};
function disRoomStop ( roomId ) {
    if( disRoom[ roomId ] ) {
        clearTimeout( disRoom[ roomId ] );
        delete disRoom[ roomId ];
    }
}