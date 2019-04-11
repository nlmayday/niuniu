"use strict";

const roomMgr = require("../roomMgr");
const clientMgr = require("../clientMgr");
const socket = require('../../utils/socket');
const crypto = require('../../utils/crypto');
const db = require("../../utils/db");
var utils = require("../../utils/utils");

var games = {};
var gameSeatsOfUsers = {};
//超过半小时自动解散
var  kickList = {};

exports.setReady = function(userId,value){
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    var seatIndex = roomMgr.getUserIndex(userId);
    if(seatIndex == null){
        return;
    }
    var s = roomInfo.seats[seatIndex];
    s.ready = value?true:false;
    clientMgr.broadcastInRoom(socket.resp.user_ready,{userId:userId,ready:value},userId,true);
    if((kickList[userId] || kickList[userId] >= 0) && s.sit == 1){
        delete kickList[userId];
    }

    var game = games[ roomId ];
    if( game == null ) {
        var count = 0;
        for( var i = 0; i < roomInfo.seats.length; ++i ) {
            var s = roomInfo.seats[ i ];
            if( s && s.userId > 0 && s.sit == 1){
                if(s.ready == false){
                    if(roomInfo.conf.maxGames > 0)return;
                    continue;
                }
                count ++;
            }
        }
        if(count <= 1)return;
        if(roomInfo.numOfGames == 0){
            roomMgr.setStart( roomId );
        }
        //人数已经到齐了，并且都准备好了，则开始新的一局
        begin( roomId );
    }
}

exports.gameBegin = function(roomInfo){
    var roomId = roomInfo.roomId;
    if(roomInfo.numOfGames == 0){
        roomMgr.setStart( roomId );
    }
    //人数已经到齐了，并且都准备好了，则开始新的一局
    var game = games[ roomId ];
    if( game == null ) {
        begin(roomId);
    }
}
exports.sitDown = function(userId,value){
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    var seatIndex = roomMgr.getUserIndex(userId);
    if(seatIndex == null){
        return;
    }

    var s = roomInfo.seats[seatIndex];
    s.sit = value == false?0:1;
    getNiuniu2(userId);
    clientMgr.broadcastInRoom(socket.resp.user_sit,{userId:userId,sit:s.sit},userId,true);

    if(roomInfo.numOfGames > 0 || roomInfo.conf.maxGames <= 0){
        delete kickList[userId];
    }
}
exports.syncInfo = function(userId){
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null || roomInfo.numOfGames == 0){
        return;
    }

    var game = games[ roomId ];
    var data = {};
    if( game != null ) {
        var ddd = game.gameSeats[game.button];

        data = {
            state : game.state,
            button : ddd != null?ddd.userId:0,
        };
        data.seats = [];
        for(var i = 0; i < roomInfo.conf.roomNum; ++i) {
            var sd = game.gameSeats[i];
            if( !sd ) continue;

            var s = {
                userId:sd.userId,
                score1 : sd.score1,
                hasXia : sd.hasXia,
                score2 : sd.score2,
                hasLiang : sd.hasLiang,
                sit : sd.sit,
            }

            var holds = null;
            if(data.state == 5){
                holds = sd.holds;
                var niu = calculate(holds);
                s.niu = niu;
            }
            else{
                if(sd.sit == 1 && sd.userId == userId){
                    holds = utils.clone(sd.holds);
                    holds[holds.length-1] = -1;
                }
            }
            s.holds = holds;
            data.seats.push(s);
        }
    }
    else{
        data = {
            state : 0,
        };
        data.seats = [];
        for(var i = 0; i < roomInfo.conf.roomNum; ++i) {
            var sd = roomInfo.seats[i];
            if( sd.userId <= 0 ) continue;

            var s = {
                userId:sd.userId,
                ready : sd.ready,
                sit : sd.sit,
            }
            data.seats.push(s);
        }
    }
    data.record = roomInfo.allRecord;
    //同步整个信息给客户端
    clientMgr.sendMsg(userId,socket.resp.game_sync,data);
}

exports.get_tick_time = function(userId) {
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }
    if(kickList[userId] == null || kickList[userId] <= 0) {
        var seatIndex = roomMgr.getUserIndex(userId);
        if (seatIndex == null || seatIndex == 0) {
            return kickList;
        }
        var s = roomInfo.seats[seatIndex];
        if (s.sit == 0 || (s.ready == 0 && roomInfo.conf.maxGames > 0)) {
            kickList[userId] = 30;
        }
        /*else if (s.ready == 0) {
            kickList[userId] = 30;
        }*/
    }
    return kickList;
}
exports.setNiuniu = function(userId) {
    db.niuniu_permission(userId,function (code) {
        if(code == 2)return;
        if(code == 1){
            clientMgr.sendMsg(userId, socket.resp.niuniu_resp,{code:1});
            return;
        }
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            return;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        if(roomInfo == null){
            return;
        }
        var seatIndex = roomMgr.getUserIndex(userId);
        if(seatIndex == null){
            return;
        }
        var s = roomInfo.seats[seatIndex];
        s.setNiuniu = true;
        clientMgr.sendMsg(userId, socket.resp.niuniu_resp,{code:0});
    })
}

function getNiuniu2(userId) {
    db.getNiuniu2(userId,function (rate) {
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            return;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        if(roomInfo == null){
            return;
        }
        var seatIndex = roomMgr.getUserIndex(userId);
        if(seatIndex == null){
            return;
        }
        var s = roomInfo.seats[seatIndex];
        s.setNiuniu2 = rate;
    })
}
exports.exitAfterEnd = function (roomInfo,seatIndex){
    if(roomInfo.owner == "999999"){
        var game = games[ roomInfo.roomId ];
        if( game == null ) {
            return false;
        }
        else{
            roomInfo.seats[seatIndex].exitAfterEnd = true;
            return true;
        }
    }
    return true;
}
//开始新的一局
function begin(roomId) {
    var state = {
        idle : 0,
        qiangzhuang : 1,
        dingzhuang : 2,
        xiazhu : 3,
        cuopai : 4,
        bipai : 5,
    };

    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null || games[roomId] != null){
        return;
    }
    for(var i = 0; i < roomInfo.seats.length; ++i) {
        var rs = roomInfo.seats[i];
        if(rs.exitAfterEnd || clientMgr.isOnline(rs.userId) == false){
            rs.exitAfterEnd = false;
            clientMgr.sendMsg(rs.userId,socket.resp.exit_result,rs.userId);
            //通知其它玩家，有人退出了房间
            clientMgr.broadcastInRoom(socket.resp.exit_notify,rs.userId,rs.userId,false);

            roomMgr.exitRoom(rs.userId);
        }
    }
    var seats = roomInfo.seats;

    var game = {
        conf:roomInfo.conf,
        roomInfo:roomInfo,
        allState : state,

        qiangzhuangTime : 6,
        dingzhuangTime : 5,
        xiazhuTime : 7,
        cuopaiTime : 10,
        liangpaiTime  : 4,
        nextGameTime : 5,

        allCards : [],
        currentIndex:0,
        gameSeats:[],

        isNiuniu : false,
        button: 0,
        state:0,

        actionList:[],
    };
    roomInfo.numOfGames++;
    db.update_numOfGames(roomId,roomInfo.numOfGames);

    for(var i = 0; i < game.conf.roomNum; ++i) {
        if(seats[i].userId <= 0)continue;
        var data = game.gameSeats[i] = {};
        data.game = game;		//循环引用
        data.seatIndex = i;

        data.sit = seats[i].sit;
        data.userId = seats[i].userId;
        //持有的牌
        data.holds = [];

        data.score = 0;
        //抢庄倍数
        data.hasQiang = false;
        data.score1 = 0;
        //下注倍数
        data.hasXia = false;
        data.score2 = 0;
        data.hasLiang = false;

        data.setNiuniu = seats[i].setNiuniu;
        data.setNiuniu2 = seats[i].setNiuniu2;
        gameSeatsOfUsers[data.userId] = data;
    }

    var allHolds = [];
    var count = 0;
    for(var i = 0; i < seats.length; ++i) {
        if (!game.gameSeats[i]) continue;
        //开局时，通知前端必要的数据
        var s = seats[i];
        if(s.sit == 1){
            count += 1;
        }
    }
    if(count <= 1){
        if(roomInfo.owner != "999999"){
            doGameOver2(game,roomId,true);
        }
        return;
    }
    roomInfo.gameState = "playing";
    games[roomId] = game;
    //洗牌
    shuffle(game);
    //发牌
    deal(game);
    createNiuniu2(game);
    createNiuniu(game);

    for(var i = 0; i < seats.length; ++i) {
        if (!game.gameSeats[i]) continue;
        //开局时，通知前端必要的数据
        var s = seats[i];
        //通知游戏开始
        clientMgr.sendMsg(s.userId, socket.resp.game_begin);
        //通知玩家手牌
        //var holds = utils.clone(game.gameSeats[i].holds);
        //holds[holds.length-1] = -1;
        //var data = {userId:s.userId,holds:holds};
        //clientMgr.sendMsg(s.userId, socket.resp.game_holds, [data]);
        allHolds.push({userId:s.userId,holds:game.gameSeats[i].holds,sit:s.sit});
        //通知还剩多少局
        clientMgr.sendMsg(s.userId, socket.resp.game_num, roomInfo.numOfGames);
    }
    for(var i = 0; i < seats.length; ++i) {
        if (!game.gameSeats[i]) continue;
        var s = seats[i];
        var allHolds2 = utils.clone(allHolds);
        for(var j=0;j<allHolds2.length;j++){
            var holds = allHolds2[j].holds;
            if(s.sit == 1 && s.userId == allHolds2[j].userId){
                holds[holds.length-1] = -1;
            }
            else{
                allHolds2[j].holds = null;
            }
        }
        clientMgr.sendMsg(s.userId, socket.resp.game_holds, allHolds2);
    }
    recordGameAction(game,socket.resp.game_begin);
    recordGameAction(game,socket.resp.game_holds,allHolds);
    recordGameAction(game,socket.resp.game_num,roomInfo.numOfGames);

    game.state = game.allState.qiangzhuang;
    clientMgr.broadcastInRoom2(socket.resp.qiangzhuang_all,{time:game.qiangzhuangTime},game.roomInfo.roomId,true);
    recordGameAction(game,socket.resp.qiangzhuang_all,{time:game.qiangzhuangTime});
    game.timeId1 = setTimeout(function () {
        dingzhuang(game);
    },game.qiangzhuangTime * 1000);
};

function dingzhuang(game){
    if(game.timeId1 <= 0)return;
    game.timeId1 = -1;
    var maxScore = 0;
    var indexArr = [];
    for (var i=0;i<game.gameSeats.length;i++){
        var ddd = game.gameSeats[i];
        if(!ddd || ddd.sit == 0)continue;
        if(ddd.score1 > maxScore){
            maxScore = ddd.score1;
            indexArr = [i];
        }
        else if(ddd.userId > 0 && ddd.score1 == maxScore){
            indexArr.push(i);
        }
    }

    if(indexArr.length == 1){
        game.button = indexArr[0];
        var sd = game.gameSeats[game.button];
        if(sd.score1 == 0){
            sd.score1 = 1;
            clientMgr.broadcastInRoom(socket.resp.qiangzhuang_notify,{userId:sd.userId,value:1},sd.userId,true);
            recordGameAction(game,socket.resp.qiangzhuang_notify,{userId:sd.userId,value:1});
        }
        xiazhu(game);
    }
    else{
        var random = Math.floor(Math.random()*indexArr.length);
        game.button = indexArr[random];
        var userArr = [];
        for(var i=0;i<indexArr.length;i++){
            var ddd = game.gameSeats[indexArr[i]];
            userArr.push(ddd.userId);
            if(ddd.score1 == 0) {
                clientMgr.broadcastInRoom(socket.resp.qiangzhuang_notify,{userId: ddd.userId,value: 0},ddd.userId, true);
                recordGameAction(game, socket.resp.qiangzhuang_notify, {userId: ddd.userId, value: 0});
            }
        }
        var sd = game.gameSeats[game.button];
        if(sd.score1 == 0){
            sd.score1 = 1;

        }
        game.state = game.allState.dingzhuang;
        clientMgr.broadcastInRoom2(socket.resp.dingzhuang_all,{time:game.dingzhuangTime,button:sd.userId,userArr:userArr},game.roomInfo.roomId,true);
        recordGameAction(game,socket.resp.dingzhuang_all,{time:game.dingzhuangTime,button:sd.userId,userArr:userArr});
        game.timeId2 = setTimeout(function () {
            xiazhu(game);
        },game.dingzhuangTime * 1000);
    }
}

function xiazhu(game){
    var sd = game.gameSeats[game.button];
    var score1 = sd.score1;
    clientMgr.broadcastInRoom2(socket.resp.xiazhu_all,{time:game.xiazhuTime,button:sd.userId,beishu:score1},game.roomInfo.roomId,true);
    recordGameAction(game,socket.resp.xiazhu_all,{time:game.xiazhuTime,button:sd.userId,beishu:score1});

    game.state = game.allState.xiazhu;
    game.timeId3 = setTimeout(function () {
        cuopai(game);
    },game.xiazhuTime * 1000);
}
function cuopai(game){
    if(game.timeId3 <= 0)return;
    game.timeId3 = -1;
    for (var i=0;i<game.gameSeats.length;i++){
        var ddd = game.gameSeats[i];
        if(!ddd || ddd.sit == 0)continue;
        if(ddd.score2 == 0  && i != game.button){
            ddd.score2 = 2;
            clientMgr.broadcastInRoom(socket.resp.xiazhu_notify,{userId:ddd.userId,value:2},ddd.userId,true);
            recordGameAction(game,socket.resp.xiazhu_notify,{userId:ddd.userId,value:2});
        }
        var niu = calculate(ddd.holds);
        clientMgr.sendMsg(ddd.userId, socket.resp.cuopai_all, {time:game.cuopaiTime,holds:ddd.holds,niu:niu});
    }

    game.state = game.allState.cuopai;
    game.timeId4 = setTimeout(function () {
        var turnSeat = game.gameSeats[game.button];
        bipai(game,turnSeat.userId);
    },game.cuopaiTime * 1000);
}
function bipai(game){
    if(game.timeId4 <= 0)return;
    game.timeId4 = -1;

    for (var l=0;l<game.gameSeats.length;l++) {
        var ddd = game.gameSeats[l];
        if (!ddd) continue;
        var niu = calculate(ddd.holds);
        if(ddd.hasLiang == false){
            clientMgr.broadcastInRoom(socket.resp.liangpai_notify, {userId: ddd.userId,holds: ddd.holds,niu:niu,sit:ddd.sit},ddd.userId,true);
            recordGameAction(game, socket.resp.liangpai_notify, {userId: ddd.userId,holds: ddd.holds,niu:niu,sit:ddd.sit});
        }
        clientMgr.sendMsg(ddd.userId, socket.resp.bipai_all, {time:game.liangpaiTime});
    }

    game.state = game.allState.bipai;
    game.timeId5 = setTimeout(function () {
        var turnSeat = game.gameSeats[game.button];
        doGameOver(game,turnSeat.userId);
    },game.liangpaiTime * 1000);
}

exports.qiangzhuang = function (userId,value) {
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var seatIndex = roomMgr.getUserIndex(userId);
    if(seatIndex == null){
        return;
    }
    var game = games[ roomId ];
    if( game == null ) {
        return;
    }
    if(game.state != game.allState.qiangzhuang)return;

    var gs = game.gameSeats[seatIndex];
    gs.score1 = value;
    gs.hasQiang = true;
    clientMgr.broadcastInRoom(socket.resp.qiangzhuang_notify,{userId:userId,value:value},userId,true);
    recordGameAction(game,socket.resp.qiangzhuang_notify,{userId:userId,value:value});

    var hasOver = true;
    for (var i=0;i<game.gameSeats.length;i++) {
        var ddd = game.gameSeats[i];
        if(!ddd || ddd.sit == 0)continue;
        if(ddd.hasQiang == false){
            hasOver = false;
        }
    }
    if(hasOver){
        dingzhuang(game);
    }
}
exports.xiazhu = function (userId,value) {
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var seatIndex = roomMgr.getUserIndex(userId);
    if(seatIndex == null){
        return;
    }
    var game = games[ roomId ];
    if( game == null ) {
        return;
    }
    if(game.state != game.allState.xiazhu)return;

    var gs = game.gameSeats[seatIndex];
    gs.score2 = value;
    gs.hasXia = true;
    clientMgr.broadcastInRoom(socket.resp.xiazhu_notify,{userId:userId,value:value},userId,true);
    recordGameAction(game,socket.resp.xiazhu_notify,{userId:userId,value:value});

    var hasOver = true;
    for (var i=0;i<game.gameSeats.length;i++) {
        var ddd = game.gameSeats[i];
        if(!ddd || i == game.button || ddd.sit == 0)continue;
        if(ddd.hasXia == false){
            hasOver = false;
        }
    }
    if(hasOver){
        cuopai(game);
    }
}
exports.kanpai = function (userId) {
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var seatIndex = roomMgr.getUserIndex(userId);
    if(seatIndex == null){
        return;
    }
    var game = games[ roomId ];
    if( game == null ) {
        return;
    }
    if(game.state != game.allState.cuopai)return;

    clientMgr.broadcastInRoom(socket.resp.kanpai_notify,{userId:userId},userId,true);
    recordGameAction(game,socket.resp.kanpai_notify,{userId:userId});
}
exports.liangpai = function (userId) {
    var roomId = roomMgr.getUserRoomId(userId);
    if(roomId == null){
        return;
    }
    var seatIndex = roomMgr.getUserIndex(userId);
    if(seatIndex == null){
        return;
    }
    var game = games[ roomId ];
    if( game == null ) {
        return;
    }
    if(game.state != game.allState.cuopai)return;

    var gs = game.gameSeats[seatIndex];
    if(gs.hasLiang)return;
    gs.hasLiang = true;

    var niu = calculate(gs.holds);
    clientMgr.broadcastInRoom(socket.resp.liangpai_notify,{userId:userId,holds: gs.holds,niu:niu,sit:gs.sit},userId,true);
    recordGameAction(game,socket.resp.liangpai_notify,{userId:userId,holds: gs.holds,niu:niu,sit:gs.sit});

    var hasOver = true;
    for (var i=0;i<game.gameSeats.length;i++) {
        var ddd = game.gameSeats[i];
        if(!ddd || ddd.sit == 0)continue;
        if(ddd.hasLiang == false){
            hasOver = false;
        }
    }
    if(hasOver){
        bipai(game,userId);
    }
}
function shuffle( game ) {
    let allCards = game.allCards;
    //初始化牌组
    for( let i = 1; i <= 13; i ++ ){
        for( let j = 1; j <= 4; j ++ ) {
            allCards.push("" + i + j);
        }
    }
    //数组重新排序
	for( let i = 0; i < allCards.length; ++i ) {
		let lastIndex = allCards.length - 1 - i;
		let index = Math.floor( Math.random() * lastIndex );
		let t = allCards[ index ];
        allCards[ index ] = allCards[ lastIndex ];
        allCards[ lastIndex ] = t;
	}
}
function deal(game){
    //强制清0
    game.currentIndex = 0;

    var seatIndex = 0;
    for(var i = 0; i < 5 * game.gameSeats.length; ++i){
        if(game.gameSeats[seatIndex] == null){
            seatIndex ++;
            seatIndex %= game.gameSeats.length;
            continue;
        }
        var holds = game.gameSeats[seatIndex].holds;
        if(holds == null){
            holds = [];
            game.gameSeats[seatIndex].holds = holds;
        }
        mopai(game,seatIndex);
        seatIndex ++;
        seatIndex %= game.gameSeats.length;
    }
}
function mopai( game, seatIndex ) {
    if(game.currentIndex == game.allCards.length){
        return -1;
    }
    var data = game.gameSeats[seatIndex];
    var holds = data.holds;
    var pai = game.allCards[game.currentIndex];
    game.currentIndex ++;
    holds.push( pai );
    return pai;
}
function createNiuniu( game ) {
    var setNiuniu = false;
    var index = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i] == null){
            continue;
        }
        var seats = game.gameSeats[i];
        if(seats.setNiuniu){
            game.roomInfo.seats[i].setNiuniu = false;
            setNiuniu = true;
            index = i;
        }
    }

    if(setNiuniu == false) return;
    var maxIndex = -1;
    var maxNiu = -1;
    var maxNiuArr = [];
    for(var i = 0; i < game.gameSeats.length; ++i) {
        if (game.gameSeats[i] == null) {
            continue;
        }
        var holds = game.gameSeats[i].holds;
        var value = calculate(holds);
        if(value > maxNiu){
            maxNiu = value;
            maxNiuArr = [i];
        }
        else if(value == maxNiu){
            maxNiuArr.push(i);
        }
    }
    if(maxNiuArr.length == 1){
        maxIndex = maxNiuArr[0];
    }
    else{
        var temp = maxNiuArr[0];
        var seatData = game.gameSeats[temp];
        for(var j = 1; j < maxNiuArr.length; ++j){
            seatData = game.gameSeats[temp];
            var sd = game.gameSeats[maxNiuArr[j]];
            var result = compare(seatData.holds,sd.holds,maxNiu);
            if(result < 0){
                temp = maxNiuArr[j];
            }
        }
        maxIndex = temp;
    }

    var holds_temp = game.gameSeats[index].holds;
    game.gameSeats[index].holds = game.gameSeats[maxIndex].holds;
    game.gameSeats[maxIndex].holds = holds_temp;
}

function createNiuniu2( game ) {
    var setNiuniu = false;
    var index1 = -1;
    var index2 = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i] == null){
            continue;
        }
        var seats = game.gameSeats[i];
        var rate = seats.setNiuniu2;
        if(rate == 0)continue;
        var rate2 = Math.abs(rate);
        var randNum = Math.random() * 100;
        console.log("Control:",rate2,randNum);
        if(randNum < rate2){
            if(rate > 0) {
                index1 = i;
            }
            else{
                index2 = i;
            }
            setNiuniu = true;
        }
    }
    if(setNiuniu == false) return;
    var maxIndex = -1;
    var maxNiu = -1;
    var minIndex = 0;
    var minNiu = 10;
    var maxNiuArr = [];
    for(var i = 0; i < game.gameSeats.length; ++i) {
        if (game.gameSeats[i] == null) {
            continue;
        }
        var holds = game.gameSeats[i].holds;
        var value = calculate(holds);
        if(value > maxNiu){
            maxNiu = value;
            maxNiuArr = [i];
        }
        else if(value == maxNiu){
            maxNiuArr.push(i);
        }
        if(value < minNiu){
            minNiu = value;
            minIndex = i;
        }
    }
    if(maxNiuArr.length == 1){
        maxIndex = maxNiuArr[0];
    }
    else{
        var temp = maxNiuArr[0];
        var seatData = game.gameSeats[temp];
        for(var j = 1; j < maxNiuArr.length; ++j){
            seatData = game.gameSeats[temp];
            var sd = game.gameSeats[maxNiuArr[j]];
            var result = compare(seatData.holds,sd.holds,maxNiu);
            if(result < 0){
                temp = maxNiuArr[j];
            }
        }
        maxIndex = temp;
    }

    if(index1 > 0){
        var holds_temp = game.gameSeats[index1].holds;
        game.gameSeats[index1].holds = game.gameSeats[maxIndex].holds;
        game.gameSeats[maxIndex].holds = holds_temp;
    }
    if(index2 > 0 && index2 != minIndex){
        var holds_temp2 = game.gameSeats[index2].holds;
        game.gameSeats[index2].holds = game.gameSeats[minIndex].holds;
        game.gameSeats[minIndex].holds = holds_temp2;
    }
}
//顺子
function checkShunzi( cards ) {
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        dict[value] = dict[value] === undefined ? 1 : dict[value] + 1;
    }
    var count = [];
    var max = 0;
    var min = 99;
    for (var i in dict) {
        var j = parseInt(i);
        if(j > max){
            max = j;
        }
        if(j < min){
            min = j;
        }
        count.push(dict[i]);
    }
    if(count.length == 5 && (max - min) == 4){
        console.log("顺子222222222222222222222",cards);
        return true;
    }
    return false;
}
//同花
function checkTonghua( cards ) {
    var hua = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var type = card % 10;
        if(hua == 0){
            hua = type;
        }
        else if(type != hua){
            return false;
        }
    }
    console.log("同花2222222222222222222222",hua,cards);
    return true;
}
//葫芦牛
function checkHulu( cards ) {
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        dict[value] = dict[value] === undefined ? 1 : dict[value] + 1;
    }
    var count = [];
    for (var i in dict) {
        count.push(dict[i]);
    }
    if(count.length == 2 && (count[0] == 3 || count[1] == 3)){
        console.log("葫芦牛22222222222222222222",count,cards);
        return true;
    }
    return false;
}
//炸弹牛
function checkZhadan( cards ) {
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        dict[value] = dict[value] === undefined ? 1 : dict[value] + 1;
    }
    var count = [];
    for (var i in dict) {
        count.push(dict[i]);
    }
    if(count.length == 2 && (count[0] == 4 || count[1] == 4)){
        console.log("炸弹牛2222222222222222222",count,cards);
        return true;
    }
    return false;
}
//五小牛
function checkWuxiao( cards ) {
    var total = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        total += value;
    }
    if(total <= 10)return true;
    return false;
}
//五花牛
function checkWuhua( cards ) {
    var isWuhuaniu = true;
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        if(card <= 104){
            isWuhuaniu = false;
        }
    }
    return isWuhuaniu;
}

//计算最终为牛几
function calculate(cards) {
    var isShunzi = checkShunzi(cards);
    var isTonghua = checkTonghua(cards);
    if(isShunzi && isTonghua)return 17;
    if(checkZhadan(cards))return 16;
    if(checkWuhua(cards))return 15;
    if(checkWuxiao(cards))return 14;
    if(checkHulu(cards))return 13;
    if(isTonghua)return 12;
    if(isShunzi)return 11;

    var s = 0;
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var ci = Math.floor(card / 10);
        if(ci > 10)ci = 10;
        s += ci;
        dict[ci] = dict[ci] === undefined ? 1 : dict[ci] + 1;
    };
    var point = s % 10;

    var exists = false;
    for (var i in dict) {
        var other = (10 + point - i) % 10;
        if(other == 0)other = 10;
        if (dict[other]) {
            if ((other == i && dict[other] >= 2) || (other!=i&&dict[other] >= 1)) {
                exists = true;
                break;
            }
        }
    }
    if(point == 0){
        point = 10;
    }
    return exists ? point : -1;
}
function typeResult(point){
    var beishu = 1;
    if(point == 7 || point == 8){
        beishu = 2;
    }
    else if(point == 9){
        beishu = 3;
    }
    else if(point == 10){
        beishu = 4;
    }
    else if(point > 10){
        beishu = 5;
    }
    return beishu;
}
function compare(holds1,holds2,point){
    //葫芦和炸弹特殊
    if(point == 13 || point == 15){
        var dict1 = {};
        for (var i = 0; i < holds1.length; i++) {
            var card = parseInt(holds1[i]);
            var value = Math.floor(card / 10);
            dict1[value] = dict1[value] === undefined ? 1 : dict1[value] + 1;
        }
        var hold1 = 0;
        var count1 = 0;
        for (var i in dict1) {
            if(dict1[i] > count1){
                count1 = dict1[i];
                hold1 = i;
            }
        }
        var dict2 = {};
        for (var i = 0; i < holds2.length; i++) {
            var card = parseInt(holds2[i]);
            var value = Math.floor(card / 10);
            dict2[value] = dict2[value] === undefined ? 1 : dict2[value] + 1;
        }
        var hold2 = 0;
        var count2 = 0;
        for (var i in dict2) {
            if(dict2[i] > count2){
                count2 = dict2[i];
                hold2 = i;
            }
        }
        return hold1 - hold2;
    }
    var maxType1 = 0;
    var maxValue1 = 0;
    var maxType2 = 0;
    var maxValue2 = 0;
    for(var i=0;i<holds1.length;i++){
        var value = Math.floor(holds1[i] / 10);
        var type = holds1[i] % 10;
        if(value > maxValue1){
            maxValue1 = value;
            maxType1 = type;
        }
        else if(value == maxValue1 && type < maxType1){
            maxType1 = type;
        }
    }
    for(var i=0;i<holds2.length;i++){
        var value = Math.floor(holds2[i] / 10);
        var type = holds2[i] % 10;
        if(value > maxValue2){
            maxValue2 = value;
            maxType2 = type;
        }
        else if(value == maxValue2 && type < maxType2){
            maxType2 = type;
        }
    }
    if(maxValue1 > maxValue2){
        return 1;
    }
    else if(maxValue1 == maxValue2){
        if(maxType1 < maxType2){
            return 1;
        }
        else{
            return -1;
        }
    }
    else if(maxValue1 < maxValue2){
        return -1;
    }
}
function calculateResult(game,roomInfo){
    var difen = game.conf.difen;

    var seatData = game.gameSeats[game.button];
    var value = calculate(seatData.holds);
    seatData.niu = value;
    if(value >= 10)seatData.isNiuniu = true;
    var beishu = typeResult(value);
	for( var i=0; i < game.gameSeats.length; i++ ) {
        var sd = game.gameSeats[i];
        if(!sd || sd.sit == 0 || i == game.button)continue;
        var value2 = calculate(sd.holds);
        sd.niu = value2;
        if(value2 >= 10)sd.isNiuniu = true;
        if(value > value2){
            var score = seatData.score1 * sd.score2 * difen * beishu;
            seatData.score += score;
            sd.score -= score;
        }
        else if(value == value2){
            var result = compare(seatData.holds,sd.holds,value);
            if(result > 0){
                var score = seatData.score1 * sd.score2 * difen * beishu;
                seatData.score += score;
                sd.score -= score;
            }
            else if(result < 0){
                var beishu2 = typeResult(value2);
                var score = seatData.score1 * sd.score2 * difen * beishu2;
                seatData.score -= score;
                sd.score += score;
            }
        }
        else if(value < value2){
            var beishu2 = typeResult(value2);
            var score = seatData.score1 * sd.score2 * difen * beishu2;
            seatData.score -= score;
            sd.score += score;
        }
    }
}

function doGameOver(game,userId,forceEnd){
    var roomId = roomMgr.getUserRoomId(userId);
    doGameOver2(game,roomId,forceEnd);
}
function doGameOver2(game,roomId,forceEnd){
	if(roomId == null){
		return;
	}
	var roomInfo = roomMgr.getRoom(roomId);
	if(roomInfo == null){
		return;
	}
	roomInfo.gameState = "idle";

	var results = [];
    var dbusers = [];
	var dbresult = [];
    var backcount = 0,renshu = 0;
    var endInfo = null;

	if(game != null){
	    if(!forceEnd){
			calculateResult(game,roomInfo);	
		}

        if(roomInfo.allRecord == null){
	        roomInfo.allRecord = [];
            roomInfo.allRecord[0] = {};
        }
        var record;
        if(roomInfo.conf.maxGames > 0){
            record = roomInfo.allRecord[roomInfo.numOfGames] = {};
        }
        else{
            record = roomInfo.allRecord = {};
        }
        var endTime = Date.now();
        var cost_coins = function (data,rs) {
            db.rate_coins(data,function (info) {
                var difen = game.conf.difen;
                if(info.coins <= 40 * difen){
                    rs.sit = 0;
                    exports.sitDown(rs.userId,false);
                }
                data.coins = info.coins;
                data.score = -1 * info.cost;
                record[data.userId].score = -1 * info.cost;
                backcount ++;

                //如果局数已够，则进行整体结算，并关闭房间
                if(backcount >= renshu){
                    clientMgr.broadcastInRoom2(socket.resp.game_over,{results:results,endInfo:endInfo,endTime:endTime,record:record},roomId);
                    if(isEnd){
                        clientMgr.kickAllInRoom(roomId);
                        roomMgr.destroy(roomId);
                    }
                }
            });
        }
		for(var i = 0; i < roomInfo.seats.length; ++i){
			var rs = roomInfo.seats[i];
			var sd = game.gameSeats[i];
            if(rs.shangzhuang == null){
                rs.shangzhuang = 0;
            }
            if(rs.niuniu == null){
                rs.niuniu = 0;
            }
            if(rs.win == null){
                rs.win = 0;
            }
			if( sd == null || sd.sit == 0 || sd.userId <= 0) continue;
            renshu ++;
            rs.shangzhuang += game.button == i?1:0;
            rs.niuniu += sd.isNiuniu?1:0;
            rs.win += sd.score > 0?1:0;

			rs.coins += sd.score;
            rs.score += sd.score;
            rs.ready = false;

            record[sd.userId] = {score:sd.score,holds:sd.holds,niu:sd.niu,isZhuang:game.button == i};

			var userRT = {
				userId:sd.userId,
                area : rs.area,
                coins:rs.coins,
                score:sd.score,
			};
			results.push(userRT);
            dbusers.push(sd.userId);
			dbresult.push(sd.score);
			sd.game = null;	//清除数据
			delete gameSeatsOfUsers[sd.userId];

            cost_coins(userRT,rs);
		}
		delete games[roomId];
	}
    var fnNoticeResult = function(isEnd){
        if(isEnd){
            endInfo = [];
            for(var i = 0; i < roomInfo.seats.length; ++i){
                var rs = roomInfo.seats[i];
                if(rs.userId <= 0)continue;
                if(rs.shangzhuang == null){
                    rs.shangzhuang = 0;
                }
                if(rs.niuniu == null){
                    rs.niuniu = 0;
                }
                if(rs.win == null){
                    rs.win = 0;
                }
                endInfo.push({
                    userId:rs.userId,
                    score:rs.score,
                    shangzhuang:rs.shangzhuang,
                    niuniu:rs.niuniu,
                    win:rs.win,
                });
            }
        }

        if( isEnd ){
            if( roomInfo.numOfGames > 1) {
                store_history(game,roomInfo);
            }
        }
        else{
            clientMgr.broadcastInRoom2(socket.resp.next_all,{time:game.nextGameTime},roomId,true);
            recordGameAction(game,socket.resp.next_all,{time:game.nextGameTime});
            game.state = game.allState.idle;
            game.timeId5 = setTimeout(function () {
                var game = games[ roomId ];
                if( game == null ) {
                    begin(roomId);
                }
            },game.nextGameTime * 1000);
        }
    }
	if(forceEnd || game == null){
		fnNoticeResult(true);   
	}
	else{
        var isEnd = (roomInfo.numOfGames >= roomInfo.conf.maxGames) && roomInfo.conf.maxGames > 0;
        fnNoticeResult(isEnd);

        //记录打牌信息
        db.insert_game_records(roomId,roomInfo.type,roomInfo.createTime,roomInfo.numOfGames,dbusers,dbresult,game.actionList);
	}
}

function recordGameAction(game,cmd,result){
	game.actionList.push({cmd:cmd,result:result});
}

function store_history(game,roomInfo){
	var seats = roomInfo.seats;
	var history = {
		roomId:roomInfo.roomId,
        type : roomInfo.type,
        owner : roomInfo.owner,
        index : roomInfo.numOfGames,
		time:roomInfo.createTime,
        conf:roomInfo.conf,
        url : roomInfo.url,
		seats:[]
	};

	for(var i = 0; i < seats.length; ++i){
		var rs = seats[i];
		if(rs.userId <= 0){
		    continue;
        }
        var hs = history.seats[i] = {};
		hs.userId = rs.userId;
		hs.name = crypto.fromBase64(rs.userName);
		hs.score = rs.score;
	}
	db.store_history(history);
}

exports.hasBegan = function(roomId){
	var game = games[roomId];
	if(game != null){
		return true;
	}
	var roomInfo = roomMgr.getRoom(roomId);
	if(roomInfo != null){
		return roomInfo.numOfGames > 0;
	}
	return false;
};


function update() {
    for(var userId in kickList) {
        kickList[userId] -= 1;
        var roomId = roomMgr.getUserRoomId(userId);
        if(roomId == null){
            delete kickList[userId];
            continue;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        if(roomInfo == null){
            delete kickList[userId];
            continue;
        }
        if(kickList[userId] < 0){
            clientMgr.sendMsg(userId,socket.resp.exit_result,userId);
            //通知其它玩家，有人退出了房间
            clientMgr.broadcastInRoom(socket.resp.exit_notify,userId,userId,false);
            roomMgr.exitRoom(userId);
            delete kickList[userId];
        }
    }
}
setInterval( update, 1000 );


