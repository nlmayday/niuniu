"use strict";

const roomMgr = require("../roomMgr");
const clientMgr = require("../clientMgr");
const checkHu = require('../checkHu');
const socket = require('../../utils/socket');
const crypto = require('../../utils/crypto');
const db = require("../../utils/db");

var games = {};
var gameSeatsOfUsers = {};

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
    var game = games[ roomId ];
    if( game == null ) {
        for( var i = 0; i < roomInfo.seats.length; ++i ) {
            var s = roomInfo.seats[ i ];
            if( s && s.ready == false || clientMgr.isOnline( s.userId ) == false )
            {
                return;
            }
        }
        //人数已经到齐了，并且都准备好了，则开始新的一局
        begin( roomId );
    }
    else {
        var numOfMJ = game.mahjongs.length - game.currentIndex;

        var data = {
            state:game.state,
            numofmj:numOfMJ,
            button:game.button,
            turn:game.turn,
            chuPai:game.chuPai,
        };

        data.seats = [];
        var seatData = null;
        for(var i = 0; i < roomInfo.conf.roomNum; ++i) {
            var sd = game.gameSeats[i];
            if( !sd ) continue;

            var s = {
                userId:sd.userId,
                folds:sd.folds,
                penggangs:sd.penggangs,
                que:sd.que,
                hued:sd.hued,
                iszimo:sd.iszimo,
                isTianTing : sd.isTianTing,
            }
            if(sd.tianTing){
                s.tianTing = sd.tianTing;
            }

            if(sd.userId == userId){
                s.holds = sd.holds;
                seatData = sd;
            }
            data.seats.push(s);
        }

        if(seatData.que == -1){
            clientMgr.sendMsg(userId,socket.resp.game_dingque,0);
        }
        //同步整个信息给客户端
        clientMgr.sendMsg(userId,socket.resp.game_sync,data);
        sendOperations(game,seatData,game.chuPai);
    }
}
exports.setDingque = function(userId,value){
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
    var gs = game.gameSeats[seatIndex];
    gs.que = value;

    var duoyu = -1;
    if(gs.holds.length == 14){
        duoyu = gs.holds.pop();
        gs.countMap[duoyu] -= 1;
    }
    checkTingPai(game,gs);
    if(duoyu >= 0){
        gs.holds.push(duoyu);
        gs.countMap[duoyu] ++;
    }

    var queArr = [];
    for( var i = 0; i < game.gameSeats.length; ++i ) {
        var s = game.gameSeats[ i ];
        if( s && s.que == -1) {
            return;
        }
        queArr.push({userId:s.userId,que:s.que});
    }
    game.state = "playing";
    var turnSeat = game.gameSeats[game.turn];
    //通知玩家出牌方
    turnSeat.canChuPai = true;
    clientMgr.broadcastInRoom(socket.resp.game_chupai,turnSeat.userId,turnSeat.userId,true);
    clientMgr.broadcastInRoom(socket.resp.result_dingque,queArr ,turnSeat.userId,true);
    //检查是否可以暗杠或者胡
    checkCanAnGang(game,turnSeat);
    //检查胡 用最后一张来检查
    checkCanHu(game,turnSeat,turnSeat.holds[turnSeat.holds.length - 1]);

    //通知前端
    sendOperations(game,turnSeat,game.chuPai);
}
//开始新的一局
function begin(roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    var seats = roomInfo.seats;

    var game = {
        conf:roomInfo.conf,
        roomInfo:roomInfo,
        canChi:false,
        dingque:roomInfo.conf.roomNum == 4?false:true,
        zhuang : roomInfo.conf.zhuang,
        lianzhuang : roomInfo.lianzhuang>0?roomInfo.lianzhuang:0,
        mantangji : roomInfo.mantangji?true:false,

        button: roomInfo.nextButton >= 0?roomInfo.nextButton:Math.floor( Math.random() * roomInfo.conf.roomNum ),
        mahjongs:[],
        currentIndex:0,
        gameSeats:[],

        turn:0,
        chuPai:-1,
        state:"idle",
        firstHupai:-1,
        yipaoduoxiang:-1,
        fangpaoshumu:-1,
        actionList:[],
        hupaiList:[],
        chupaiCnt:0,     //记录本局出牌数
        lastMopai:0,

        allJi : [],
        chongfengji:-1,    //幺鸡冲锋鸡
        //zerenji:-1,
        pengji2 : -1,
        gangji2 : -1,

        guoshoupeng: {},		//过手碰
        oldturn : {} 			//用户上一轮摸牌

    };
    roomInfo.numOfGames++;
    db.update_numOfGames(roomId,roomInfo.numOfGames);

    for(var i = 0; i < game.conf.roomNum; ++i) {
        var data = game.gameSeats[i] = {};

        data.game = game;		//循环引用
        data.seatIndex = i;
        data.userId = seats[i].userId;
        data.lunci = 0; //出牌轮次
        //持有的牌
        data.holds = [];
        //打出的牌
        data.folds = [];
        //暗杠的牌
        data.penggangs = [];
        //玩家手上的牌的数目，用于快速判定碰杠
        data.countMap = {};
        //玩家听牌，用于快速判定胡了的番数
        data.tingMap = {};
        data.pattern = "";

        //是否可以杠
        data.canGang = false;
        //用于记录玩家可以杠的牌
        data.gangPai = [];

        data.canChi = false,
        data.chiPai = [],
        //是否可以碰
        data.canPeng = false;
        //是否可以胡
        data.canHu = false;
        //是否可以出牌
        data.canChuPai = false;

        data.guoHuTime = 0;
        data.que = -1;
        //有杠才能接炮
        data.hasGang = false;
        //是否胡了
        data.hued = false;
        //是否是自摸
        data.iszimo = false;

        data.isGangHu = false;
        //
        data.actions = [];

        data.fan = 0;
        data.score = 0;
        data.lastFangGangSeat = -1;

        //统计信息
        data.numZiMo = 0;
        data.numJiePao = 0;
        data.numDianPao = 0;
        data.numAnGang = 0;
        data.numMingGang = 0;

        gameSeatsOfUsers[data.userId] = data;
    }
    games[roomId] = game;

    //洗牌
    shuffle(game);
    //发牌
    deal(game);

    var numOfMJ = game.mahjongs.length - game.currentIndex;
    var allHolds = [];
    for(var i = 0; i < seats.length; ++i) {
        if (!game.gameSeats[i]) continue;

        //开局时，通知前端必要的数据
        var s = seats[i];
        //通知玩家手牌
        var data = {userId:s.userId,holds:game.gameSeats[i].holds};
        clientMgr.sendMsg(s.userId, socket.resp.game_holds, [data]);
        allHolds.push(data);
        //通知还剩多少张牌
        clientMgr.sendMsg(s.userId, socket.resp.mj_count, numOfMJ);
        //通知还剩多少局
        clientMgr.sendMsg(s.userId, socket.resp.game_num, roomInfo.numOfGames);
        //通知游戏开始
        clientMgr.sendMsg(s.userId, socket.resp.game_begin, game.button);
    }
    recordGameAction(game,socket.resp.game_holds,allHolds);
    recordGameAction(game,socket.resp.mj_count,numOfMJ);
    recordGameAction(game,socket.resp.game_num,roomInfo.numOfGames);
    recordGameAction(game,socket.resp.game_begin,game.button);

    var turnSeat = game.gameSeats[game.turn];
    if(game.dingque){
        game.state = "dingque";
        clientMgr.broadcastInRoom(socket.resp.game_dingque,0,turnSeat.userId,true);
    }
    else{
        const len = game.gameSeats.length;
        //进行听牌检查
        for(var m = 0; m < len; ++m){
            var duoyu = -1;
            var gs = game.gameSeats[m];
            if(gs.holds.length == 14){
                duoyu = gs.holds.pop();
                gs.countMap[duoyu] -= 1;
            }
            checkTingPai(game,gs);
            if(duoyu >= 0){
                gs.holds.push(duoyu);
                gs.countMap[duoyu] ++;
            }
        }
        game.state = "playing";
        //通知玩家出牌方
        turnSeat.canChuPai = true;
        clientMgr.broadcastInRoom(socket.resp.game_chupai,turnSeat.userId,turnSeat.userId,true);

        //检查是否可以暗杠或者胡
        checkCanAnGang(game,turnSeat);
        //检查胡 用最后一张来检查
        checkCanHu(game,turnSeat,turnSeat.holds[turnSeat.holds.length - 1]);

        //通知前端
        sendOperations(game,turnSeat,game.chuPai);
    }
};
exports.reqTianTing = function (userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;

    if(seatData.tianTing){
        dochupai(game,seatData);
        seatData.tianTing = false;
        seatData.isTianTing = true;
        clientMgr.broadcastInRoom(socket.resp.game_tianTing,userId,userId,true);
    }
}
function getMJType(id) {
    id = parseInt( id );
    if(id >= 0 && id < 9){
        return 0;
    }
    else if(id >= 9 && id < 18){
        return 1;
    }
    else if(id >= 18 && id < 27){
        return 2;
    }
    else if(id >= 27 && id < 34){
        return 3;
    }
    else if(id >= 34 && id < 42){
        return 4;
    }
    return -1;
}

function shuffle( game ) {
    let mahjongs = game.mahjongs;
    //初始化牌组
    for( let i = 0; i < 27; i ++ ){
        mahjongs.push( i, i , i , i );
    }
    //数组重新排序
	for( let i = 0; i < mahjongs.length; ++i ) {
		let lastIndex = mahjongs.length - 1 - i;
		let index = Math.floor( Math.random() * lastIndex );
		let t = mahjongs[ index ];
		mahjongs[ index ] = mahjongs[ lastIndex ];
		mahjongs[ lastIndex ] = t;
	}
    //作弊脚本，定制牌组
    initTiles(game);
}
function initTiles( game ) {
    let mahjongs = game.mahjongs;
    const fs = require('fs');
    if(fs.existsSync(__dirname + "/initTiles.json") === false){
        console.log("文件不存在");
        return;
    }
    console.log("文件读取完成");
    var content = fs.readFileSync(__dirname + "/initTiles.json");
    var initTiles = JSON.parse(content);
    if(initTiles.mode !== "debug"){
        return;
    }
    var seat1 = initTiles.holds[0];
    var seat2 = initTiles.holds[1];
    var seat3 = initTiles.holds[2];
    var seat4 = initTiles.holds[3];
    var tiles = initTiles.holds;
    if (seat1.length != 13||seat2.length != 13||seat3.length != 13||seat4.length != 13){
        console.log("摆牌数量错误");
        return false;
    }
    var arr = [];
    for(var i = 0; i < 27; ++i){
        arr[i] = 4;
    }

    var seatIndex = 0;
    var card;
    for(var i = 0; i < game.conf.roomNum * 13; ++i){
        card = tiles[seatIndex++][Math.floor(i/game.conf.roomNum)];
        if(card < 0 || card >= 27){
            console.log("摆牌数值错误");
            return;
        }
        arr[card] --;
        if(arr[card] < 0){
            console.log("摆牌牌数错误");
            return;
        }
        seatIndex %= game.conf.roomNum;
    }
    var front = initTiles.front;
    for(var i=0;i<front.length;i++){
        var card = front[i];
        if(card < 0 || card >= 27){
            console.log("front数值错误");
            return;
        }
        arr[card] --;
        if(arr[card] < 0){
            console.log("front牌数错误");
            return;
        }
    }
    var back = initTiles.back;
    for(var i=0;i<back.length;i++){
        var card = back[i];
        if(card < 0 || card >= 27){
            console.log("back数值错误");
            return;
        }
        arr[card] --;
        if(arr[card] < 0){
            console.log("back牌数错误");
            return;
        }
    }

    seatIndex = 0;
    var bPosition = 0;
    for(var i = 0; i < game.conf.roomNum * 13; ++i){
        card = tiles[seatIndex++][Math.floor(i/ game.conf.roomNum)];
        mahjongs[bPosition++] = card;
        seatIndex %= game.conf.roomNum;
    }
    for(var i=0;i<front.length;i++){
        mahjongs[bPosition++] = front[i];
    }

    var leftCard = [];
    var bPosition2 = 0;
    for (var i = 0; i < 27; i++){
        for (var j = 0; j < arr[i]; j++){
            leftCard[bPosition2++] = i;
        }
    }
    for(var i = 0; i < leftCard.length; ++i){
        var lastIndex = leftCard.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = leftCard[index];
        leftCard[index] = leftCard[lastIndex];
        leftCard[lastIndex] = t;
    }
    for(var i = 0; i < leftCard.length; ++i){
        mahjongs[bPosition++] = leftCard[i];
    }
    for(var i=0;i<back.length;i++){
        mahjongs[bPosition++] = back[i];
    }

    console.log("手牌 ：",mahjongs);
}
function deal(game){
    //强制清0
    game.currentIndex = 0;

    //每人13张 一共 13*4 ＝ 52张 庄家多一张 53张
    var seatIndex = game.button;
    for(var i = 0; i < 13 * game.conf.roomNum; ++i){
        var mahjongs = game.gameSeats[seatIndex].holds;
        if(mahjongs == null){
            mahjongs = [];
            game.gameSeats[seatIndex].holds = mahjongs;
        }
        mopai(game,seatIndex);
        seatIndex ++;
        seatIndex %= game.conf.roomNum;
    }

    //庄家多摸最后一张
    mopai(game,game.button);
    //当前轮设置为庄家
    game.turn = game.button;
}
function mopai( game, seatIndex, isGang ) {
	if(game.currentIndex == game.mahjongs.length){
		return -1;
	}
	var data = game.gameSeats[seatIndex];
	var mahjongs = data.holds;
	var pai = game.mahjongs[game.currentIndex];
	if( isGang ) {
	    var temp = pai;
		pai = game.mahjongs[ game.mahjongs.length - 1 - game.lastMopai];
        game.mahjongs[ game.currentIndex ] = pai;
        game.mahjongs[ game.mahjongs.length - 1 - game.lastMopai] = temp;
        game.lastMopai ++;
    }

    game.currentIndex ++;
	mahjongs.push( pai );
	//统计牌的数目 ，用于快速判定（空间换时间）
	var c = data.countMap[ pai ];
	if(c == null) {
		c = 0;
	}
	data.countMap[pai] = c + 1;
	return pai;
}
//检查是否可以吃
function checkCanChi(game,seatData,targetPai) {
    if(!game.canChi)return;
    var type = getMJType(targetPai);
    var countMap = seatData.countMap;
    if(countMap[targetPai-2] > 0 && countMap[targetPai-1] > 0 && getMJType(targetPai-2) == type && getMJType(targetPai-1) == type){
        seatData.canChi = true;
        seatData.chiPai.push({index:1,chi:[targetPai-2,targetPai-1,targetPai],pai:targetPai});
    }
    if(countMap[targetPai-1] > 0 && countMap[targetPai+1] > 0 && getMJType(targetPai-1) == type && getMJType(targetPai+1) == type){
        seatData.canChi = true;
        seatData.chiPai.push({index:2,chi:[targetPai-1,targetPai,targetPai+1],pai:targetPai});
    }
    if(countMap[targetPai+1] > 0 && countMap[targetPai+2] > 0 && getMJType(targetPai+1) == type && getMJType(targetPai+2) == type){
        seatData.canChi = true;
        seatData.chiPai.push({index:3,chi:[targetPai,targetPai+1,targetPai+2],pai:targetPai});
    }
}
//检查是否可以碰
function checkCanPeng(game,seatData,targetPai) {
    if(seatData.isTianTing)return;
    if(game.dingque && getMJType(targetPai) == seatData.que){
        return;
    }
	var count = seatData.countMap[targetPai];
	if(count != null && count >= 2){
		seatData.canPeng = true;
	}
}

//检查是否可以点杠
function checkCanDianGang(game,seatData,targetPai){
    if(seatData.isTianTing)return;
    if(game.dingque && getMJType(targetPai) == seatData.que){
        return;
    }
	//检查玩家手上的牌
	//如果没有牌了，则不能再杠
	if(game.currentIndex >= game.mahjongs.length){
		return;
	}
	var count = seatData.countMap[targetPai];
	if(count != null && count >= 3){
		seatData.canGang = true;
		seatData.gangPai.push(targetPai);
		return;
	}
}

//检查是否可以暗杠
function checkCanAnGang(game,seatData){
    if(seatData.isTianTing)return;
	//如果没有牌了，则不能再杠
	if(game.currentIndex >= game.mahjongs.length){
		return;
	}
	for(var key in seatData.countMap){
        var c = seatData.countMap[key];
        if(c == 4){
            var pai = parseInt(key);
            if(game.dingque && getMJType(pai) == seatData.que){
                console.log(11111111111,"缺门不能杠");
                continue;
            }
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
	}
}

//检查是否可以弯杠(自己摸起来的时候)
function checkCanWanGang(game,seatData){
    if(seatData.isTianTing)return;
	//如果没有牌了，则不能再杠
    if(game.currentIndex >= game.mahjongs.length){
        return;
    }
    var pai = seatData.holds.pop();
	//从碰过的牌中选
	for(var i = 0; i < seatData.penggangs.length; ++i){
        if(seatData.penggangs[i][0] != "peng")continue;
		var peng = seatData.penggangs[i][1];
        if(peng == pai){
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
	}
    seatData.holds.push(pai);
}
function checkCanQiangGang(game,turnSeat,seatData,pai){
    if(game.dingque && getMJType(pai) == turnSeat.que){
        return false;
    }
    var hasActions = false;
    for(var i = 0; i < game.gameSeats.length; ++i){
        //杠牌者不检查
        if(seatData.seatIndex == i){
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if(ddd.hued){
            continue;
        }

        checkCanHu(game,ddd,pai,true);
        if(ddd.canHu){
            sendOperations(game,ddd,pai);
            hasActions = true;
        }
    }
    if(hasActions){
        game.qiangGangContext = {
            turnSeat:turnSeat,
            seatData:seatData,
            pai:pai,
            isValid:true,
        }
    }
    else{
        game.qiangGangContext = null;
    }
    return game.qiangGangContext != null;
}

function checkCanHu(game,seatData,targetPai,isqianggang) {
	//game.lastHuPaiSeat = -1;
	seatData.canHu = false;
    if(game.dingque && getMJType(targetPai) == seatData.que){
        return;
    }
	var count = 0;
	for(var i=0;i<game.conf.laizi.length;i++) {
		//鬼牌大于等于4，直接胡牌
        count += seatData.countMap[ game.conf.laizi[i]];
	}
	if(count > 3){
        seatData.canHu = true;
    }
    for(var i=0;i< seatData.tingMap.length;i++) {
        if(seatData.tingMap[i] == targetPai){
            seatData.canHu = true;
            break;
        }
    }
    if(seatData.canHu == false)return;
	if(isqianggang) return;
    if(game.gameSeats[game.turn].isTianTing)return;
	if(seatData.isTianTing)return;
    //热炮，可平胡点炮
    if(game.gameSeats[game.turn].lastFangGangSeat > 0){
        return;
    }
    if(game.chuPai >= 0 && seatData.hasGang == false && isDahu(seatData) == false && seatData.lunci > 0){
        seatData.canHu = false;
    }
}
//检查听牌
function checkTingPai( game, seatData ) {
    if(seatData.isTianTing)return;
    seatData.tingMap = [];
    if(game.dingque){
        for(var i=0;i<seatData.holds.length;i++){
            if(getMJType(seatData.holds[i]) == seatData.que){
                return;
            }
        }
    }
    /*var map = checkHu.check13yao( seatData.countMap,game.conf.laizi );	//十三幺
    if( map.length > 0 ) {
        map = map.concat(game.conf.laizi);
        seatData.tingMap = map;
        seatData.pattern = '13yao';
        clientMgr.sendMsg(seatData.userId, socket.resp.game_ting, {tingMap:seatData.tingMap,pattern:seatData.pattern});
        return;
    }*/
    var map = checkHu.check7dui( seatData.holds, game.conf.laizi );  //检查7对
    if( map.length > 0 ) {
        map = map.concat(game.conf.laizi);
        seatData.tingMap = map;
        seatData.pattern = '7dui';
        clientMgr.sendMsg(seatData.userId, socket.resp.game_ting, {tingMap:seatData.tingMap,pattern:seatData.pattern});
        return;
    }
    map = checkHu.doCheckTing( seatData.holds, game.conf.laizi );	   //检查平胡
    if( map.length > 0 ) {
        map = map.concat(game.conf.laizi);
        seatData.tingMap = map;
        seatData.pattern = 'normal';
        clientMgr.sendMsg(seatData.userId, socket.resp.game_ting, {tingMap:seatData.tingMap,pattern:seatData.pattern});
        return;
    }
}
function clearAllOptions(game,seatData){
	var fnClear = function(sd){
        sd.canChi = false;
        sd.chiPai = [];
		sd.canPeng = false;
		sd.canGang = false;
		sd.gangPai = [];
		sd.canHu = false;
		sd.lastFangGangSeat = -1;	
	}
	if(seatData){
		fnClear(seatData);
	}
	else{
		game.qiangGangContext = null;
		for(var i = 0; i < game.gameSeats.length; ++i){
			fnClear(game.gameSeats[i]);
		}
	}
}

//检查用户牌组是否是清一色
function checkQingyise( seatData ) {
	const holds = seatData.holds;
	const _type = getMJType( holds[ 0 ] );
	for( let i = 1; i < holds.length; i ++ ) {
		if( _type != getMJType( holds[ i ] ) ) {
			return false;
		}
	}
	for( let i = 0; i < seatData.penggangs.length; i++ ) {
	    if(typeof seatData.penggangs[i][1] == "number"){
            if( _type != getMJType( seatData.penggangs[i][1] ) ) {
                return false;
            }
        }
        else if(typeof seatData.penggangs[i][1] == "object"){
            if( _type != getMJType( seatData.penggangs[i][1][0] ) ) {
                return false;
            }
        }
	}
	return true;
}
//检查用户牌组是否是清一色
function checkDuidui( seatData ) {
    var countMap = seatData.countMap;
    var game = seatData.game;
    if( game.chuPai > 0 ){
        countMap[game.chuPai]++;
    }
    var jiangCount = 0;
    for( let i in countMap) {
        if (countMap[i] == 2) {
            jiangCount++;
            if (jiangCount > 1) {
                if( game.chuPai > 0 ){
                    countMap[game.chuPai]--;
                }
                return false;
            }
        }
        if (countMap[i] == 1 || countMap[i] == 4) {
            if( game.chuPai > 0 ){
                countMap[game.chuPai]--;
            }
            return false;
        }
    }
    if( game.chuPai > 0 ){
        countMap[game.chuPai]--;
    }
    return true;
}
function checkLong7dui(seatData) {
    if(seatData.pattern == "7dui"){
        var game = seatData.game;
        var countMap = seatData.countMap;
        if( game.chuPai > 0 ){
            countMap[game.chuPai]++;
        }
        for( let i in countMap) {
            if (countMap[i] == 4) {
                if( game.chuPai > 0 ){
                    countMap[game.chuPai]--;
                }
                return true;
            }
        }
    }
    return false;
}
function isDahu(seatData){
    if(checkQingyise(seatData) || checkDuidui(seatData) || seatData.pattern == "7dui"){
        return true;
    }
    return false;
}

function hasOperations(seatData){
	if(seatData.canGang || seatData.canPeng || seatData.canChi || seatData.canHu){
		return true;
	}
	return false;
}
function sendOperations(game,seatData,pai) {
	if(hasOperations(seatData)){
		if(pai == -1){
			pai = seatData.holds[seatData.holds.length - 1];
		}
		
		var data = {pai:pai};
		if(seatData.canHu) {
		    data.hu = true;
        }
        if(seatData.canGang) {
            data.gang = true;
            data.gangpai = seatData.gangPai;
        }
        if(seatData.canPeng) {
            data.peng = true;
        }
        if(seatData.canChi) {
            data.chi = true;
            data.chipai = seatData.chiPai;
        }
		//如果可以有操作，则进行操作
        clientMgr.sendMsg(seatData.userId,socket.resp.game_action,data);
	}
	else{
        clientMgr.sendMsg(seatData.userId,socket.resp.game_action);
	}
}

function moveToNextUser(game,nextSeat){
	game.fangpaoshumu = 0;
	//找到下一个没有和牌的玩家
	if( nextSeat == null ) {
		while( true ) {
			game.turn ++;
			game.turn %= game.conf.roomNum;
			var turnSeat = game.gameSeats[game.turn];
			if( turnSeat.hued == false ){
				return;
			}
		}
	}
	else {
		game.turn = nextSeat;
	}
}

function doUserMoPai(game, isGang ){
	game.chuPai = -1;
	var turnSeat = game.gameSeats[game.turn];
	turnSeat.lastFangGangSeat = -1;

	var pai = mopai(game,game.turn, isGang ? true : false);
	//牌摸完了，结束
	if(pai == -1){
		doGameOver(game,turnSeat.userId,0);
		return;
	}
	else{
		var numOfMJ = game.mahjongs.length - game.currentIndex;
        clientMgr.broadcastInRoom(socket.resp.mj_count,numOfMJ,turnSeat.userId,true);
        recordGameAction(game,socket.resp.mj_count,numOfMJ);
	}
    //移除过手碰
    if(game.guoshoupeng[ turnSeat.userId ] != null){
        delete game.guoshoupeng[ turnSeat.userId ];
    }

    //广播通知玩家出牌方
    turnSeat.canChuPai = true;
    clientMgr.broadcastInRoom(socket.resp.game_chupai,turnSeat.userId,turnSeat.userId,true);
    recordGameAction(game,socket.resp.game_chupai,turnSeat.userId);
	//通知前端新摸的牌
    clientMgr.sendMsg(turnSeat.userId,socket.resp.game_mopai,pai);
    clientMgr.broadcastInRoom(socket.resp.game_mopai,-1,turnSeat.userId,false);
    recordGameAction(game,socket.resp.game_mopai,pai);
	//检查是否可以暗杠或者胡
	//检查胡，直杠，弯杠
	checkCanAnGang(game,turnSeat);
	checkCanWanGang(game,turnSeat,pai);

	//检查看是否可以和
	checkCanHu(game,turnSeat,pai);

	//通知玩家做对应操作
	sendOperations(game,turnSeat,game.chuPai);
}

function calculateResult(game,roomInfo){
	//var baseScore = 1;
    var diangangpao = -1;
	for( var i=0; i < game.gameSeats.length; i++ ) {
        var sd = game.gameSeats[i];
        sd.peifen = 0;
        sd.jifen = 0;
        if (sd.tingMap.length == 0) {
            sd.isTing = 0;
            continue;
        }
        sd.isTing = 1;
        sd.numAnGang = 0;
        sd.numDianGangs = 0;
        sd.numWanGangs = 0;
        for (var j = 0; j < sd.penggangs.length; j++) {
            if (sd.penggangs[j][0] == "angang") {
                sd.numAnGang++;
            }
            else if (sd.penggangs[j][0] == "diangang") {
                sd.numDianGangs++;
            }
            else if (sd.penggangs[j][0] == "wangang") {
                sd.numWanGangs++;
            }
        }
        var score = 0;
        var isQingyise = checkQingyise(sd);
        var isDuidui = checkDuidui(sd);
        var is7dui = sd.pattern == "7dui";
        var isLong7dui = checkLong7dui(sd);
        var isDandiao = sd.holds.length <= 2;
        if (!is7dui && !isQingyise || !isDandiao && !isDuidui) {
            score = 2;
            sd.pinghu = 1;
        }
        else {
            if (isQingyise) {
                if (isLong7dui) {
                    score = 30;
                    sd.qinglongbei = 1;
                }
                else if (is7dui) {
                    score = 20;
                    sd.qing7dui = 1;
                }
                else if (isDandiao) {
                    score = 20;
                    sd.qingdandiao = 1;
                }
                else if (isDuidui) {
                    score = 15;
                    sd.qingdadui = 1;
                }
                else {
                    score = 10;
                    sd.qingyise = 1;
                }
            }
            else {
                if (isLong7dui) {
                    score = 20;
                    sd.long7dui = 1;
                }
                else if (is7dui) {
                    score = 10;
                    sd.is7dui = 1;
                }
                else if (isDandiao) {
                    score = 10;
                    sd.dandiao = 1;
                }
                else if (isDuidui) {
                    score = 5;
                    sd.daduizi = 1;
                }
            }
        }
        if ((sd.hued && sd.isTianTing) || sd.isTianHu || sd.isDiHu) {
            if (sd.pinghu) score = 10;
            else score += 10;
        }

        var extra = 0;
        if (game.zhuang == 1) {
            if (!sd.pinghu) extra = 2;
        }
        else if (game.zhuang == 2 && i == game.button) {
            extra = game.lianzhuang;
        }

        for (var j = 0; j < sd.actions.length; j++) {
            //循环遍历玩家动作
            var ac = sd.actions[j];
            if (ac.type == "diangangpao") {
                diangangpao = i;
                break;
            }
            if (ac.type == "wangang" || ac.type == "diangang" || ac.type == "angang") {
                var additonalscore = 3;
                //扣掉目标方的分
                for (var t = 0; t < ac.targets.length; ++t) {
                    game.gameSeats[ac.targets[t]].score -= additonalscore;
                }
                additonalscore *= ac.targets.length;
                sd.score += additonalscore;
            }
            else if (ac.type == "zimo" || ac.type == "hu" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "qiangganghu") {
                if (ac.type == "ganghua") {
                    score += 2;
                }
                else if (ac.type == "dianganghua") {
                    score += 2;
                }
                else if (ac.type == 'qiangganghu') {
                    score *= ac.targets.length - 1;
                }

                for (var t = 0; t < ac.targets.length; ++t) {
                    game.gameSeats[ac.targets[t]].score -= score + extra;
                    sd.score += score + extra;
                }
            }
        }
    }
    for( var i=0; i < game.gameSeats.length; i++ ) {
        if( diangangpao == i ) {
            continue;
        }
        var sd = game.gameSeats[i];
        var jiCount = 0;
        if (game.chongfengji == i) {
            sd.chongfengji = 1;
		    var jibase1 = 0;
            var jibase2 = 0;
            var peibase1 = 0;
            var peibase2 = 0;
		    var extra2 = 0;
		    if(game.zerenji){
		        let gs = game.gameSeats[game.zerenji.seatIndex];
                gs.zerenji = 1;
		        if(gs.tingMap.length == 0){
                    if(game.zerenji.isPeng){
                        peibase2 = 3;
                        extra2 = 2;
                    }
                    else if(game.zerenji.isGang){
                        peibase2 = 4;
                        extra2 = 2;
                    }
                }
                else{
                    if(game.zerenji.isPeng){
                        jibase2 = 3;
                        extra2 = 2;
                    }
                    else if(game.zerenji.isGang){
                        jibase2 = 4;
                        extra2 = 2;
                    }
                }
                if(game.zerenji.isHu){
		            sd.jifen -= gs.score;
                    gs.jifen += gs.score;
                }
                sd.peifen += peibase2 + extra2;
                gs.peifen -= peibase2 + extra2;
                sd.jifen -= jibase2 + extra2;
                gs.jifen += jibase2 + extra2;
                for(var t = 0; t < game.gameSeats.length; ++t ) {
		            if(t == game.zerenji.seatIndex || t == sd.seatIndex)continue;
                    var gs2 = game.gameSeats[t];
                    gs2.peifen += peibase2;
                    gs.peifen -= peibase2;
                    gs2.jifen -= jibase2;
                    gs.jifen += jibase2;
                }

                if(game.gangji2 >= 0){
                    var gs3 = game.gameSeats[game.gangji2];
                    if(gs3.tingMap.length == 0){
                        for(var t = 0; t < game.gameSeats.length; ++t ) {
                            if(t == game.gangji2)continue;
                            var gs2 = game.gameSeats[t];
                            var peifen = 4;
                            if(t == sd.seatIndex)peifen = 7;
                            gs2.peifen += peifen;
                            gs3.peifen -= peifen;
                        }
                    }
                    else{
                        for(var t = 0; t < game.gameSeats.length; ++t ) {
                            if(t == game.gangji2)continue;
                            var gs2 = game.gameSeats[t];
                            var jifen = 7;
                            if(t == sd.seatIndex)jifen = 9;
                            gs2.jifen -= jifen;
                            gs3.jifen += jifen;
                        }
                    }
                }
            }
            else{
                jiCount += 1;
                if(sd.tingMap.length == 0){
                    peibase1 = 3;
                }
                else{
                    jibase1 = 3;
                }
                for(var t = 0; t < game.gameSeats.length; ++t ) {
                    if(t == sd.seatIndex)continue;
                    var gs2 = game.gameSeats[t];
                    gs2.peifen += peibase1;
                    sd.peifen -= peibase1;
                    gs2.jifen -= jibase1;
                    sd.jifen += jibase1;
                }
            }
        }
        var jiScore = 0;
        for(var m=0;m<sd.holds.length;m++){
            for(var n=0;n<game.allJi.length;n++){
                if(sd.holds[m] == game.allJi[n]){
                    jiCount += 1;
                    jiScore += 1;
                    break;
                }
            }
        }
        for(var m=0;m<sd.penggangs.length;m++) {
            var pai = sd.penggangs[m][1];
            for(var n=0;n<game.allJi.length;n++) {
                if (pai == game.allJi[n]) {
                    var geshu = 3;
                    if (sd.penggangs[m][0] != "peng") {
                        geshu += 1;
                    }
                    jiCount += geshu;
                    jiScore += geshu;
                    break;
                }
            }
        }
        if(game.mantangji){
            for(var m=0;m<sd.folds.length;m++) {
                for (var n = 0; n < game.allJi.length; n++) {
                    if (sd.holds[m] == game.allJi[n]) {
                        jiCount += 1;
                        jiScore += 1;
                        break;
                    }
                }
            }
        }
        sd.jiCount = jiCount;
        for (var k = 0; k < game.gameSeats.length; ++k) {
            var ddd = game.gameSeats[k];
            ddd.jifen -= jiScore;
            sd.jifen += jiScore;
        }
    }
}
//流局
function calculateResult2(game,roomInfo){
    //var baseScore = 1;
    var ting = true;
    var meiting = true;
    for( var i=0; i < game.gameSeats.length; i++ ) {
        var sd = game.gameSeats[i];
        sd.peifen = 0;
        sd.jifen = 0;
        sd.jiCount = 0;
        if (sd.tingMap.length == 0) {
            ting = false;
        }
        else {
            sd.isTing = 1;
            meiting = false;
        }
    }
    if(ting || meiting)return;

    for( var i=0; i < game.gameSeats.length; i++ ) {
        var sd = game.gameSeats[i];
        var score = 0;
        var maxScore = 0;
        for(var j=0;j<sd.tingMap.length;j++){
            var pai = sd.tingMap[j];
            sd.holds.push(pai);
            sd.countMap[pai] ++;
            var isQingyise = checkQingyise(sd);
            var isDuidui = checkDuidui(sd);
            var is7dui = sd.pattern == "7dui";
            var isLong7dui = checkLong7dui(sd);
            var isDandiao = sd.holds.length <= 2;
            if( !is7dui && !isQingyise || !isDandiao && !isDuidui){
                score = 2;
                //sd.pinghu = 1;
            }
            else {
                if (isQingyise) {
                    if (isLong7dui) {
                        score = 30;
                        //sd.qinglongbei = 1;
                    }
                    else if (is7dui) {
                        score = 20;
                        //sd.qing7dui = 1;
                    }
                    else if (isDandiao) {
                        score = 20;
                        //sd.qingdandiao = 1;
                    }
                    else if (isDuidui) {
                        score = 15;
                        //sd.qingdadui = 1;
                    }
                    else {
                        score = 10;
                        //sd.qingyise = 1;
                    }
                }
                else {
                    if (isLong7dui) {
                        score = 20;
                        //sd.long7dui = 1;
                    }
                    else if (is7dui) {
                        score = 10;
                        //sd.is7dui = 1;
                    }
                    else if (isDandiao) {
                        score = 10;
                        //sd.dandiao = 1;
                    }
                    else if (isDuidui) {
                        score = 5;
                        //sd.daduizi = 1;
                    }
                }
            }
            if( sd.isTianTing ){
                if(score == 2)score = 10;
                else score += 10;
            }
            sd.holds.pop();
            sd.countMap[pai] --;

            if(score > maxScore){
                maxScore = score;
            }
        }
        for( var k=0; k < game.gameSeats.length; k++ ){
            if(i == k)continue;
            game.gameSeats[k].score -= maxScore;
            game.gameSeats[i].score += maxScore;
        }
    }
}

function doGameOver(game,userId,forceEnd){
	var roomId = roomMgr.getUserRoomId(userId);
	if(roomId == null){
		return;
	}
	var roomInfo = roomMgr.getRoom(roomId);
	if(roomInfo == null){
		return;
	}
	var results = [];
    var dbusers = [];
	var dbresult = [];

	if(game != null){
	    if(forceEnd == 0){
            calculateResult2(game,roomInfo);
        }
		else if(!forceEnd){
			calculateResult(game,roomInfo);	
		}
		for(var i = 0; i < roomInfo.seats.length; ++i){
			var rs = roomInfo.seats[i];
			var sd = game.gameSeats[i];

			if( !sd ) continue;

			if(sd.peifen == null){
                sd.peifen = 0;
			}
            if(sd.jifen == null){
                sd.jifen = 0;
            }
            if(sd.jiCount == null){
                sd.jiCount = 0;
            }
			rs.ready = false;
			rs.score += sd.score + sd.peifen + sd.jifen;

			rs.numZiMo += sd.numZiMo;
			rs.numJiePao += sd.numJiePao;
			rs.numDianPao += sd.numDianPao;
			rs.numAnGang += sd.numAnGang;
			rs.numMingGang += sd.numMingGang;
			
			var userRT = {
				userId:sd.userId,
				holds:sd.holds,
                penggangs:sd.penggangs,
				fan:sd.fan,
				score:sd.score,
                peifen:sd.peifen,
                jifen:sd.jifen,
                jiCount:sd.jiCount,
                totalScore : sd.score + sd.peifen + sd.jifen,
                pattern:sd.pattern,
                actions:[],
			};
			if(sd.pinghu)userRT.pinghu = 1;
            if(sd.long7dui)userRT.long7dui = 1;
            if(sd.is7dui)userRT.is7dui = 1;
            if(sd.dandiao)userRT.dandiao = 1;

            if(sd.daduizi)userRT.daduizi = 1;
            if(sd.qinglongbei)userRT.qinglongbei = 1;
            if(sd.qing7dui)userRT.qing7dui = 1;
            if(sd.qingdandiao)userRT.qingdandiao = 1;

            if(sd.qingdadui)userRT.qingdadui = 1;
            if(sd.qingyise)userRT.qingyise = 1;
            if(sd.isTianTing)userRT.isTianTing = 1;
            if(sd.isTianHu)userRT.isTianHu = 1;
            if(sd.isDiHu)userRT.isDiHu = 1;

            if(sd.isTing)userRT.isTing = 1;

            if(sd.chongfengji)userRT.chongfengji = 1;
            if(sd.zerenji)userRT.zerenji = 1;

            for(var k in sd.actions){
				userRT.actions[k] = {
					type:sd.actions[k].type,
				};
			}
			results.push(userRT);
            dbusers.push(sd.userId);
			dbresult.push(sd.score);
			sd.game = null;	//清除数据
			delete gameSeatsOfUsers[sd.userId];
		}

		delete games[roomId];
		/*if(game.yipaoduoxiang >= 0){
			roomInfo.nextButton = game.yipaoduoxiang;
		}*/
		if(game.firstHupai >= 0){
			roomInfo.nextButton = game.firstHupai;
			if(roomInfo.nextButton == game.button){
                roomInfo.lianzhuang = roomInfo.lianzhuang?roomInfo.lianzhuang+1:1;
            }
            else{
                roomInfo.lianzhuang = 0;
            }
		}
		else{
			roomInfo.nextButton = game.button;
            roomInfo.lianzhuang = roomInfo.lianzhuang?roomInfo.lianzhuang+1:1;
        }
	}
    var fnNoticeResult = function(isEnd){
        var endInfo = null;
        if(isEnd){
            endInfo = [];
            for(var i = 0; i < roomInfo.seats.length; ++i){
                var rs = roomInfo.seats[i];
                endInfo.push({
                    score:rs.score,
                    numzimo:rs.numZiMo,
                    numjiepao:rs.numJiePao,
                    numdianpao:rs.numDianPao,
                    numangang:rs.numAnGang,
                    numminggang:rs.numMingGang,
                });
            }
        }

        clientMgr.broadcastInRoom(socket.resp.game_over,{results:results,endInfo:endInfo},userId,true);
        recordGameAction(game,socket.resp.mj_count,{results:results,endInfo:endInfo});
        //如果局数已够，则进行整体结算，并关闭房间
        if( isEnd ){
            if( roomInfo.numOfGames > 1) {
                store_history(game,roomInfo);
            }
            clientMgr.kickAllInRoom(roomId);
            roomMgr.destroy(roomId);
        }
        else{
            for(var i=0;i<dbresult.length;i++){
                db.update_seat_info(roomId,i,null,null,dbresult[i]);
            }
        }
    }
    console.log(forceEnd ,game);
	if(forceEnd || game == null){
		fnNoticeResult(true);   
	}
	else{
        var isEnd = (roomInfo.numOfGames >= roomInfo.conf.maxGames);
        fnNoticeResult(isEnd);

        //记录打牌信息
        db.insert_game_records(roomId,roomInfo.type,roomInfo.createTime,roomInfo.numOfGames,dbusers,dbresult,game.actionList);

        if(roomInfo.numOfGames == 1) {
            var cost = 1;
            db.cost_gems( [roomInfo.owner], cost);
        }
	}
}

function recordUserAction(game,seatData,type,target){
	var d = {type:type,targets:[]};
	if(target != null){
		if(typeof(target) == 'number'){
			d.targets.push(target);	
		}
		else{
			d.targets = target;
		}
	}
	else{
		for(var i = 0; i < game.gameSeats.length; ++i){
			var s = game.gameSeats[i];
			if(i != seatData.seatIndex && s.hued == false){
				d.targets.push(i);
			}
		}		
	}
	seatData.actions.push(d);
	return d;
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
		var hs = history.seats[i] = {};
		hs.userId = rs.userId;
		hs.name = crypto.fromBase64(rs.userName);
		hs.score = rs.score;
	}
	db.store_history(history);
}

exports.chuPai = function(userId,pai){
    pai = parseInt(pai);
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if(game.turn != seatData.seatIndex){
        console.log("not your turn.");
        return;
    }

    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }

    if(seatData.canChuPai == false){
        console.log('no need chupai.');
        return;
    }

    if(hasOperations(seatData)){
        console.log('plz guo before you chupai.');
        return;
    }

    if(seatData.isTianTing && pai != seatData.holds[seatData.holds.length-1]){
        console.log('you hava tianting , can not huan pai.');
        return;
    }
    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if(index == -1){
        console.log("holds:" + seatData.holds);
        console.log("can't find mj." + pai);
        return;
    }

    seatData.canChuPai = false;
    game.chupaiCnt ++;
    seatData.guoHuFan = -1;

    seatData.holds.splice(index,1);
    seatData.countMap[pai] --;
    game.chuPai = pai;
    seatData.lunci ++;

    checkTingPai(game,seatData);
    if(seatData.lunci == 1 && seatData.tingMap.length > 0){
        seatData.tianTing = true;
        clientMgr.sendMsg(seatData.userId, socket.resp.game_ting, {tianTing:1});
        recordGameAction(game,socket.resp.game_ting,{tianTing:1});
        return;
    }

    dochupai(game,seatData);
};
function dochupai(game,seatData) {
    clientMgr.broadcastInRoom(socket.resp.game_chupai_notify,{userId:seatData.userId,pai:game.chuPai},seatData.userId,true);
    recordGameAction(game,socket.resp.game_chupai_notify,{userId:seatData.userId,pai:game.chuPai});
    //如果出的牌可以胡，则算过胡
    if(seatData.tingMap[game.chuPai]){
        seatData.guoHuTime ++;
    }

    //包鸡规则
    if(game.chuPai == 18 && game.chongfengji == -1){
        game.chongfengji = seatData.seatIndex;
        game.ischongfengji = true;
        clientMgr.broadcastInRoom(socket.resp.chongfengji,seatData.userId,seatData.userId,true);
        recordGameAction(game,socket.resp.chongfengji,seatData.userId);
    }

    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    for(var i = 0; i < game.gameSeats.length; ++i){
        //玩家自己不检查
        if(game.turn == i){
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if(ddd.hued){
            continue;
        }

        if((i - seatData.seatIndex + game.conf.roomNum) % game.conf.roomNum == 1){
            checkCanChi(game,ddd,game.chuPai);
        }
        if( game.guoshoupeng[ ddd.userId ] == null || game.guoshoupeng[ ddd.userId ][game.chuPai] == null) {
            //当前用户未被限制，才能碰
            checkCanPeng(game,ddd,game.chuPai);
        }
        checkCanDianGang(game,ddd,game.chuPai);
        checkCanHu(game,ddd,game.chuPai);

        if(hasOperations(ddd)){
            sendOperations(game,ddd,game.chuPai);
            hasActions = true;
        }
    }
    //如果没有人有操作，则向下一家发牌，并通知他出牌
    if(!hasActions){
        clientMgr.broadcastInRoom(socket.resp.guo_notify,{userId:seatData.userId,pai:game.chuPai},seatData.userId,true);
        recordGameAction(game,socket.resp.guo_notify,{userId:seatData.userId,pai:game.chuPai});
        seatData.folds.push(game.chuPai);
        if(game.chuPai == 18 && game.ischongfengji) {
            game.ischongfengji = false;
        }
        moveToNextUser(game);
        doUserMoPai(game);
    }
}
exports.chi = function(userId,index){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;

    //如果是他出的牌，则忽略
    if(game.turn == seatData.seatIndex){
        console.log("it's your turn.");
        return;
    }

    //如果没有碰的机会，则不能再碰
    if(seatData.canChi == false){
        console.log("seatData.peng == false");
        return;
    }

    //和的了，就不要再来了
    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while(true){
        var i = (i + 1)% game.conf.roomNum;
        if(i == game.turn){
            break;
        }
        else{
            var ddd = game.gameSeats[i];
            if((ddd.canHu || ddd.canGang || ddd.canPeng) && i != seatData.seatIndex){
                return;
            }
        }
    }
    var chipai = null;
    for(var i=0;i<seatData.chiPai.length;i++){
        if(seatData.chiPai[i].index == index){
            chipai = seatData.chiPai[i];
        }
    }
    var pai = game.chuPai;
    if(chipai == null || chipai.pai != pai)return;
    for(var i=0;i<chipai.chi.length;i++){
        if(chipai.chi[i] != chipai.pai){
            var index = seatData.holds.indexOf(chipai.chi[i]);
            if(index == -1){
                console.log("can't find mj.");
                return;
            }
        }
    }
    for(var i=0;i<chipai.chi.length;i++){
        if(chipai.chi[i] != chipai.pai){
            var index = seatData.holds.indexOf(chipai.chi[i]);
            seatData.holds.splice(index,1);
            seatData.countMap[chipai.chi[i]] --;
        }
    }
    clearAllOptions(game);

    seatData.penggangs.push(["chi",chipai]);
    game.chuPai = -1;

    //广播通知其它玩家
    clientMgr.broadcastInRoom(socket.resp.chi_notify,{userId:seatData.userId,chipai:chipai},seatData.userId,true);
    recordGameAction(game,socket.resp.chi_notify,{userId:seatData.userId,chipai:chipai});
    //碰的玩家打牌
    moveToNextUser(game,seatData.seatIndex);

    //广播通知玩家出牌方
    seatData.canChuPai = true;
    clientMgr.broadcastInRoom(socket.resp.game_chupai,seatData.userId,seatData.userId,true);
    recordGameAction(game,socket.resp.game_chupai,seatData.userId);
};
exports.peng = function(userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;

    //如果是他出的牌，则忽略
    if(game.turn == seatData.seatIndex){
        console.log("it's your turn.");
        return;
    }

    //如果没有碰的机会，则不能再碰
    if(seatData.canPeng == false){
        console.log("seatData.peng == false");
        return;
    }

    //和的了，就不要再来了
    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while(true){
        var i = (i + 1)% game.conf.roomNum;
        if(i == game.turn){
            break;
        }
        else{
            var ddd = game.gameSeats[i];
            if(ddd.canHu && i != seatData.seatIndex){
                return;
            }
        }
    }

    var pai = game.chuPai;
    //验证手上的牌的数目
    var c = seatData.countMap[pai];
    if(c == null || c < 2){
        console.log("pai:" + pai + ",count:" + c);
        console.log(seatData.holds);
        console.log("lack of mj.");
        return;
    }

    if(game.chuPai == 18 && game.ischongfengji) {
        game.ischongfengji = false;
        game.zerenji = {seatIndex:seatData.seatIndex,isPeng:true};
    }
    else if(game.chuPai == 18) {
        game.pengji2 = seatData.seatIndex;
    }

    clearAllOptions(game);
    delete game.guoshoupeng[ userId ];	//移除过手碰限制

    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for(var i = 0; i < 2; ++i){
        var index = seatData.holds.indexOf(pai);
        if(index == -1){
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index,1);
        seatData.countMap[pai] --;
    }
    seatData.penggangs.push(["peng",pai]);
    game.chuPai = -1;

    //广播通知其它玩家
    clientMgr.broadcastInRoom(socket.resp.peng_notify,{userId:seatData.userId,pai:pai},seatData.userId,true);
    recordGameAction(game,socket.resp.peng_notify,{userId:seatData.userId,pai:pai});
    //碰的玩家打牌
    moveToNextUser(game,seatData.seatIndex);

    //广播通知玩家出牌方
    seatData.canChuPai = true;
    clientMgr.broadcastInRoom(socket.resp.game_chupai,seatData.userId,seatData.userId,true);
    recordGameAction(game,socket.resp.game_chupai,seatData.userId);
};

exports.gang = function(userId,pai){
	var seatData = gameSeatsOfUsers[userId];
	if(seatData == null){
		console.log("can't find user game data.");
		return;
	}
	var seatIndex = seatData.seatIndex;
	var game = seatData.game;

	//如果没有杠的机会，则不能再杠
	if(seatData.canGang == false) {
		console.log("seatData.gang == false");
		return;
	}

	//和的了，就不要再来了
	if(seatData.hued){
		console.log('you have already hued. no kidding plz.');
		return;
	}

	if(seatData.gangPai.indexOf(pai) == -1){
		console.log("the given pai can't be ganged.");
		return;   
	}

	//如果有人可以胡牌，则需要等待
	var i = game.turn;
	while(true){
		var i = (i + 1)% game.conf.roomNum;
		if(i == game.turn){
			break;
		}
		else{
			var ddd = game.gameSeats[i];
			if(ddd.canHu && i != seatData.seatIndex){
				return;	
			}
		}
	}
	delete game.guoshoupeng[ userId ];	//移除过手碰

	var numOfCnt = seatData.countMap[pai];

	var gangtype = ""
	//弯杠 去掉碰牌
	if(numOfCnt == 1){
		gangtype = "wangang"
	}
	else if(numOfCnt == 3){
		gangtype = "diangang"
	}
	else if(numOfCnt == 4){
		gangtype = "angang";
	}
	else{
		console.log("invalid pai count.");
		return;
	}

    if(game.chuPai == 18 && game.ischongfengji) {
        game.ischongfengji = false;
        game.zerenji = {seatIndex:seatData.seatIndex,isGang:true};
    }
	game.chuPai = -1;
	clearAllOptions(game);
	seatData.canChuPai = false;

    clientMgr.broadcastInRoom(socket.resp.hangang_notify,{userId:seatData.userId,pai:pai,gangtype:gangtype},seatData.userId,true);
    recordGameAction(game,socket.resp.hangang_notify,{userId:seatData.userId,pai:pai,gangtype:gangtype});
	
	//如果是弯杠，则需要检查是否可以抢杠
	var turnSeat = game.gameSeats[game.turn];
	if(numOfCnt == 1){
		var canQiangGang = checkCanQiangGang(game,turnSeat,seatData,pai);
		if(canQiangGang){
			return;
		}
	}
	
	doGang(game,turnSeat,seatData,gangtype,numOfCnt,pai);
};
function doGang(game,turnSeat,seatData,gangtype,numOfCnt,pai){
    var seatIndex = seatData.seatIndex;
    var gameTurn = turnSeat.seatIndex;

    seatData.hasGang = true;
    var isZhuanShouGang = false;
    if(gangtype == "wangang"){
        for(var i=0;i<seatData.penggangs.length;i++) {
            if (seatData.penggangs[i][0] == "peng" && seatData.penggangs[i][1] == pai) {
                seatData.penggangs[i][0] = "wangang";
                break;
            }
        }
        //如果最后一张牌不是杠的牌，则认为是转手杠
        if(seatData.holds[seatData.holds.length - 1] != pai){
            isZhuanShouGang = true;
        }
    }

    //记录下玩家的杠牌
    if(gangtype == "angang"){
        seatData.penggangs.push(["angang",pai]);
        if(seatData.folds.length > 0 && seatData.holds[seatData.holds.length - 1] != pai){
            isZhuanShouGang = true;
        }
        if(isZhuanShouGang == false){
            recordUserAction(game,seatData,"angang");
        }
        else{
            recordUserAction(game,seatData,"zhuanshougang");
        }
    }
    else if(gangtype == "diangang"){
        seatData.penggangs.push(["diangang",pai]);
        recordUserAction(game,seatData,"diangang",gameTurn);
        var fs = turnSeat;
        recordUserAction(game,fs,"fanggang",seatIndex);
    }
    else if(gangtype == "wangang"){
        if(isZhuanShouGang == false){
            recordUserAction(game,seatData,"wangang");
            if(pai == 18){
                game.gangji2 = seatIndex;
            }
        }
        else{
            recordUserAction(game,seatData,"zhuanshougang");
        }
    }
    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for(var i = 0; i < numOfCnt; ++i){
        var index = seatData.holds.indexOf(pai);
        if(index == -1){
            console.log(seatData.holds);
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index,1);
        seatData.countMap[pai] --;
    }

    checkTingPai(game,seatData);
    //通知其他玩家，有人杠了牌
    clientMgr.broadcastInRoom(socket.resp.gang_notify,{userId:seatData.userId,pai:pai,gangtype:gangtype},seatData.userId,true);
    recordGameAction(game,socket.resp.gang_notify,{userId:seatData.userId,pai:pai,gangtype:gangtype});
    //变成自己的轮子
    moveToNextUser(game,seatIndex);
    //再次摸牌
    doUserMoPai(game, true);

    //只能放在这里。因为过手就会清除杠牌标记
    seatData.lastFangGangSeat = gameTurn;
}

exports.hu = function(userId){
	var seatData = gameSeatsOfUsers[userId];
	if(seatData == null){
		console.log("can't find user game data.");
		return;
	}

	var seatIndex = seatData.seatIndex;
	var game = seatData.game;

	//如果他不能和牌，那和个啥啊
	if(seatData.canHu == false){
		console.log("invalid request.");
		return;
	}

	//和的了，就不要再来了
	if(seatData.hued){
		console.log('you have already hued. no kidding plz.');
		return;
	}

	//标记为和牌
	seatData.hued = true;
	var hupai = game.chuPai;
	var isZimo = false;

	var turnSeat = game.gameSeats[game.turn];
	seatData.isGangHu = turnSeat.lastFangGangSeat >= 0;
	var notify = -1;
	var type = "";
	if( game.qiangGangContext != null ) {
		var gangSeat = game.qiangGangContext.seatData;
		hupai = game.qiangGangContext.pai;
		notify = hupai;
		var ac = recordUserAction(game,seatData,"qiangganghu",gangSeat.seatIndex);	
		ac.iszimo = false;
        type = "qiangganghu";
		seatData.isQiangGangHu = true;
		game.qiangGangContext.isValid = false;

		// var idx = gangSeat.holds.indexOf(hupai);
		// if( idx != -1 ) {
		// 	gangSeat.holds.splice(idx,1);
		// 	gangSeat.countMap[hupai]--;
		// 	clientMgr.sendMsg(gangSeat.userId,'game_holds_push',gangSeat.holds);
		// }
		//将牌添加到玩家的手牌列表，供前端显示
		seatData.holds.push(hupai);
		if(seatData.countMap[ hupai ] ) {
			seatData.countMap[hupai]++;
		}
		else {
			seatData.countMap[hupai] = 1;
		}
		recordUserAction( game,gangSeat,"beiqianggang", seatIndex );
	}
	else if(game.chuPai == -1) {
		//hupai = seatData.holds[seatData.holds.length - 1];
		notify = -1;
		if(seatData.isGangHu){
			if(turnSeat.lastFangGangSeat == seatIndex){
				var ac = recordUserAction(game,seatData,"ganghua");
                type = "ganghua";
				ac.iszimo = true;
			}
		}
		else{
			var ac = recordUserAction(game,seatData,"zimo");
            type = "zimo";
			ac.iszimo = true;
		}
		isZimo = true;
        seatData.numZiMo ++;
	}
	else{
		notify = game.chuPai;
		//将牌添加到玩家的手牌列表，供前端显示
		seatData.holds.push(game.chuPai);
		if(seatData.countMap[game.chuPai]){
			seatData.countMap[game.chuPai]++;
		}
		else{
			seatData.countMap[game.chuPai] = 1;
		}
		var at = "hu";
		//炮胡
		if(turnSeat.lastFangGangSeat >= 0){
            recordUserAction(game,seatData,"dianganghua",turnSeat.seatIndex);
            recordUserAction(game,turnSeat,"diangangpao",seatData.seatIndex);
            at = "dianganghua";
		}
		else{
            recordUserAction(game,seatData,at,game.turn);
        }
        type = at;
        seatData.numDianPao ++;
		//记录玩家放炮信息
		var fs = game.gameSeats[game.turn];
        fs.numJiePao ++;
		recordUserAction(game,fs,"fangpao",seatIndex);

		game.fangpaoshumu++;

		if(game.fangpaoshumu > 1){
			game.yipaoduoxiang = seatIndex;
		}
	}

	if(game.firstHupai < 0){
		game.firstHupai = seatIndex;
	}

	seatData.iszimo = isZimo;

	//game.hupaiList.push(seatData.seatIndex);

    if(game.chupaiCnt == 0 && game.button == seatData.seatIndex){
        seatData.isTianHu = true;
    }
    if(seatData.lunci == 0 && game.button != seatData.seatIndex){
        seatData.isDiHu = true;
    }

    if(game.chuPai == 18 && game.ischongfengji) {
        game.ischongfengji = false;
        game.zerenji = {seatIndex:seatData.seatIndex,isHu:true};
    }
    game.chuPai = -1;
	clearAllOptions(game,seatData);

    var fanji = -1;
    if(game.currentIndex < game.mahjongs.length){
        fanji = game.mahjongs[game.currentIndex];
        var type = getMJType(fanji);
        var value = Math.floor((fanji+1)%9);
        if(game.conf.jiType == 1){
            game.allJi.push(type * 9 + value);
        }
        else if(game.conf.jiType == 2){
            game.allJi.push(type * 9 + value);
            value = Math.floor((fanji+8)%9);
            game.allJi.push(type * 9 + value);
        }
    }
    game.fanji = fanji;
	//通知前端，有人和牌了
    clientMgr.broadcastInRoom(socket.resp.game_hupai,{userId:seatData.userId,type:type,hupai:notify,fanji:fanji},seatData.userId,true);
    recordGameAction(game,socket.resp.game_hupai,{userId:seatData.userId,type:type,hupai:notify,fanji:fanji});
	//
	// if(game.lastHuPaiSeat == -1){
	// 	game.lastHuPaiSeat = seatIndex;
	// }
	// else{
	// 	var lp = (game.lastFangGangSeat - game.turn + game.conf.roomNum ) % game.conf.roomNum;
	// 	var cur = (seatData.seatIndex - game.turn + game.conf.roomNum ) % game.conf.roomNum;
	// 	if(cur > lp){
	// 		game.lastHuPaiSeat = seatData.seatIndex;
	// 	}
	// }

	//如果只有一家没有胡，则结束
	/*var numOfHued = 0;
	for(var i = 0; i < game.gameSeats.length; ++i){
		var ddd = game.gameSeats[i];
		if(ddd.hued){
			numOfHued ++;
		}
	}
	//有人和牌了，则直接结束
	if( numOfHued == 1 ) {
		doGameOver(game,seatData.userId);
        return;
	}*/

	//清空所有非胡牌操作
	/*for(var i = 0; i < game.gameSeats.length; ++i){
		var ddd = game.gameSeats[i];
		ddd.canPeng = false;
		ddd.canGang = false;
		ddd.canChuPai = false;
		sendOperations(game,ddd,hupai);
	}*/

	//如果还有人可以胡牌，则等待
	for(var i = 0; i < game.gameSeats.length; ++i){
		var ddd = game.gameSeats[i];
		if(ddd.canHu){
			return;
		}
	}
    doGameOver(game,seatData.userId);
};

exports.guo = function(userId){
	var seatData = gameSeatsOfUsers[userId];
	if(seatData == null){
		console.log("can't find user game data.");
		return;
	}
	var seatIndex = seatData.seatIndex;
	var game = seatData.game;

	if(seatData.tianTing){
        dochupai(game,seatData);
        seatData.tianTing = false;
    }
	//如果玩家没有对应的操作，则也认为是非法消息
	if((seatData.canGang || seatData.canPeng || seatData.canHu) == false){
		console.log("no need guo.");
		return;
	}

	//如果是玩家自己的轮子，不是接牌，则不需要额外操作
	var doNothing = game.chuPai == -1 && game.turn == seatIndex;

	clearAllOptions(game,seatData);
	
	if( game.chuPai != -1) {
		if(game.guoshoupeng[ userId ] == null)game.guoshoupeng[ userId ] = {};
        game.guoshoupeng[ userId ][game.chuPai] = 1;
	}
	//这里还要处理过胡的情况
	if(game.chuPai >= 0 && seatData.canHu){
		seatData.guoHuTime ++;
	}

	if(doNothing){
		return;
	}
	
	//如果还有人可以操作，则等待
	for(var i = 0; i < game.gameSeats.length; ++i){
		var ddd = game.gameSeats[i];
		if(hasOperations(ddd)){
			return;
		}
	}

	//如果是已打出的牌，则需要通知。
	if(game.chuPai >= 0){
		var uid = game.gameSeats[game.turn].userId;
        clientMgr.broadcastInRoom(socket.resp.guo_notify,{userId:uid,pai:game.chuPai},seatData.userId,true);
        recordGameAction(game,socket.resp.guo_notify,{userId:uid,pai:game.chuPai});
		seatData.folds.push(game.chuPai);
		game.chuPai = -1;
	}
	
	var qiangGangContext = game.qiangGangContext;
	//清除所有的操作
	clearAllOptions(game);
	
	if(qiangGangContext != null && qiangGangContext.isValid){
		doGang(game,qiangGangContext.turnSeat,qiangGangContext.seatData,"wangang",1,qiangGangContext.pai);		
	}
	else{
		//下家摸牌
		moveToNextUser(game);
		doUserMoPai(game);   
	}
};

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

var dissolvingList = [];

exports.doDissolve = function(roomId){
	var roomInfo = roomMgr.getRoom(roomId);
	if(roomInfo == null){
		return null;
	}
	console.log( 'come here5555');
	var game = games[roomId];
	doGameOver(game,roomInfo.seats[0].userId,true);
};

exports.dissolveRequest = function(roomId,userId){
	var roomInfo = roomMgr.getRoom(roomId);
	if(roomInfo == null){
		return null;
	}
	if(roomInfo.dr != null){
		return null;
	}
	var seatIndex = roomMgr.getUserIndex(userId);
	if(seatIndex == null){
		return null;
	}

	roomInfo.dr = {
		endTime:Date.now() + 30000,
		//states:[false,false,false,false]
		states : []
	};
	for( let i = 0; i < roomInfo.conf.roomNum; i ++ ){
		roomInfo.dr.states.push( false );
	}
	roomInfo.dr.states[seatIndex] = true;

	dissolvingList.push(roomId);

	return roomInfo;
};

exports.dissolveAgree = function(roomId,userId,agree){
	var roomInfo = roomMgr.getRoom(roomId);
	if(roomInfo == null){
		return null;
	}

	if(roomInfo.dr == null){
		return null;
	}

	var seatIndex = roomMgr.getUserIndex(userId);
	if(seatIndex == null){
		return null;
	}

	if(agree){
		roomInfo.dr.states[seatIndex] = true;
        update();
	}
	else{
		roomInfo.dr = null;
		var idx = dissolvingList.indexOf(roomId);
		if(idx != -1){
			dissolvingList.splice(idx,1);		   
		}
	}
	return roomInfo;
};

function update() {
	var len = dissolvingList.length;
	for(var i = len - 1; i >= 0; --i) {
		if( !dissolvingList[ i ] ) break;

		var roomId = dissolvingList[i];
		
		var roomInfo = roomMgr.getRoom( roomId );
		if( roomInfo && roomInfo.dr ) {
			if( Date.now() > roomInfo.dr.endTime ) {
				exports.doDissolve( roomId );
				dissolvingList.splice( i, 1 ); 
			}
		}
		else {
			dissolvingList.splice( i, 1 );
		}
	}
}
setInterval( update, 1000 );

