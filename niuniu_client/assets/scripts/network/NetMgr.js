var Websocket = require('Websocket');

var netState = cc.Enum({
    unconnect : 0,
    connected : 1,
    connecting: 2,
    closed    : 3,
    failed    : 4
});

var req =  cc.Enum({
    getLeaderboard           : 1,    //得到排行榜列表
    getOpenedRooms           : 2,    //得到创建房间列表
    getMatchOfToday          : 3,    //得到今日赛事列表
    create_room              : 4,
    enter_private_room       : 5,
    enter_public_room        : 6,
    getHistoryList           : 7,
    getGamesOfRoom           : 8,
    getDetailOfGame          : 9,
    getListOfShop            : 10,
    getListOfPayRecords      : 11,
    updateTaskState          : 12,
    getRoomConfig            : 13,
    getNotify                : 14,
    getRoomsList             : 15,
    leave_roomList           : 16,
    save_money               : 17,
    takeOut_money            : 18,

    create_union             : 20,
    join_union               : 21,
    get_unionInfo            : 22,
    apply_coin               : 23,
    offer_coin               : 24,
    join_list                : 25,
    apply_list               : 26,
    apply_record             : 27,
    offer_record             : 28,  
    apply_record_all         : 30,
    offer_record_all         : 31,
    member_list              : 32,
    award_coin               : 33,
    award_coin_list          : 34,
    exit_union               : 35,
    dealDoudou               : 36,
    dealJoin                 : 37,
    award_count              : 38,
    setManager               : 39,
    
    sitDown                  : 48,
    start                    : 49,
    login                    : 50,
    ready                    : 51,
    chupai                   : 52,
    peng                     : 53,
    gang                     : 54,
    hu                       : 55,
    guo                      : 56,
    exit                     : 57,
    dispress                 : 58,
    dissolve_request         : 59,
    dissolve_agree           : 60,
    dissolve_reject          : 61,
    chat                     : 62,
    quick_chat               : 63,
    emoji                    : 64,
    voice                    : 65,
    magic                    : 66,

    chi                      : 70,
    dingque                  : 71,
    tianTing                 : 72,

    qiangzhuang              : 101,
    xiazhu                   : 102,
    kanpai                   : 103,
    liangpai                 : 104,

    niuniu                   : 150,
});

var resp =  cc.Enum({
    leaderboard_resp         : 1,
    openedRooms_resp         : 2,
    matchOfToday_resp        : 3,
    create_room_resp         : 4,
    enter_private_room_resp  : 5,
    enter_public_room_resp   : 6,
    getHistoryList_resp      : 7,
    getGamesOfRoom_resp      : 8,
    getDetailOfGame_resp     : 9,
    getListOfShop_resp       : 10,
    getListOfPayRecords_resp : 11,
    updateTaskState_resp     : 12,
    getRoomConfig_resp       : 13,
    getNotify_resp           : 14,
    getRoomsList_resp        : 15,
    roomsList_refresh        : 16,
    
    create_union_resp        : 20,
    get_unionInfo_resp       : 21,
    apply_record_resp        : 22,
    offer_record_resp        : 23,
    join_list_resp           : 24,
    apply_list_resp          : 25,
    apply_record_all_resp    : 26,
    offer_record_all_resp    : 27,
    member_list_resp         : 28,
    award_coin_resp          : 29,
    award_coin_list_resp     : 30,
    award_count_resp         : 31,

    union_change             : 40,
    money_change             : 41,
    unoin_coins_change       : 42,
    unoin_member_change      : 43,
    dealDoudou_resp          : 44,
    dealJoin_resp            : 45,

    user_sit                 : 49,
    login_result             : 50,
    new_user                 : 51,
    user_state               : 52,
    user_ready               : 53,
    dispress                 : 54,
    exit_result              : 55,
    exit_notify              : 56,
    game_holds               : 57,
    game_begin               : 58,
    game_sync                : 59,
    game_state               : 60,
    game_num                 : 61,
    mj_count                 : 62,
    game_chupai              : 63,
    game_chupai_notify       : 64,
    guo_notify               : 65,
    game_mopai               : 66,
    game_action              : 67,
    peng_notify              : 68,
    gang_notify              : 69,
    hangang_notify           : 70,
    game_ting                : 71,
    game_over                : 72,
    game_hupai               : 73,
    chi_notify               : 74,
    game_dingque             : 75,
    result_dingque           : 76,
    game_tianTing            : 77,
    chongfengji              : 78,

    dissolve_notice          : 80,
    dissolve_cancel          : 81,
    chat                     : 82,
    quick_chat               : 83,
    emoji                    : 84,
    voice                    : 85,
    magic                    : 86,

    qiangzhuang_all          : 101,
    dingzhuang_all           : 102,
    xiazhu_all               : 103,
    cuopai_all               : 104,
    bipai_all                : 105,
    next_all                 : 106,
    qiangzhuang_notify       : 107,
    xiazhu_notify            : 108,
    kanpai_notify            : 109,
    liangpai_notify          : 110,
    
    niuniu_resp              : 150,
});

var gameId = 1;
var NetworkMgr = cc.Class({
    properties: {
        wsUri:"",
        wsConn : null,
        state : 0,
        cmdHandlers : null,
        hallUrl : "",
    },
    
    onLoad: function () {
        this.wsConn = new Websocket();
        this.state = netState.unconnect;

        this.cmdHandlers = new Map();
        this.req = req;
        this.resp = resp;

        this.isClose = true;
        setInterval(this.heartBeat,3000);

        cc.game.on(cc.game.EVENT_HIDE, function () {
            var self = cc.vv.netMgr;
            self.wsConn.close();
            self.receivePong = true;
            self.notActive = true;

            cc.audioEngine.pauseAll();
            //cc.audioEngine.stopAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            cc.audioEngine.resumeAll();
            cc.vv.eventManager.removeAllEvent();
            var self = cc.vv.netMgr;
            self.notActive = false;
            if(self.isClose)return;
            if(self.isConnecting)return;
            self.isConnecting = true;
            var node = cc.director.getScene().getChildByName("Canvas");
            cc.vv.prefabMgr.waitOpen(node,"重连中");
            self.waitOpen = true;
            self.initLink(function(){
                if(self.waitOpen){
                    cc.vv.prefabMgr.waitClose();
                    self.waitOpen = false;
                }
            });
        });    
    },

    initLink: function(onConnectCB,noNeedClose){
        this.state = netState.connecting;
        this.onConnectCB = onConnectCB;
        try{
            this.wsConn.connect(this.wsUri,this.onOpen,this.onClose,this.onError,this.onMessage,noNeedClose);
        }
        catch (e) {
            var xnode = cc.director.getScene().getChildByName("Canvas");
            cc.vv.prefabMgr.alertOpen(xnode,"提示","初始化网络异常");
            return;
        }
    },
    close : function(){
        this.isClose = true;
        this.wsConn.close();
        
    },
    //游戏结束服务器主动断开连接，不需断线重连
    noNeedConnect : function(){
        this.noNeedReConnect = true;
    },
    setHandler : function(cmd,cb){
        this.cmdHandlers.set(cmd,cb);
    },
    deleteHandler : function(cmd){
        this.cmdHandlers.delete(cmd);
    },
    onOpen: function (evt) {
        var self = cc.vv.netMgr;
        console.log("Network Connected");
        self.receivePong = true;
        self.state = netState.connected;
        self.wsConn.send(1, {cmd:0,userId:cc.vv.userMgr.userId,area:cc.vv.userMgr.area});

        self.isConnecting = false;
        self.isClose = false;
        if(self.onConnectCB){
            self.onConnectCB();
            self.onConnectCB = null;
        }

        //var xnode = cc.director.getScene().getChildByName("Canvas");
        //cc.vv.prefabMgr.alertOpen(xnode,"提示","netMgr-网络打开onOpen");
    },
 
    onClose: function (evt) {
        var self = cc.vv.netMgr;
        self.state = netState.closed;
        cc.vv.log(6,"Network DISCONNECTED" + evt);

        //var xnode = cc.director.getScene().getChildByName("Canvas");
        //cc.vv.prefabMgr.alertOpen(xnode,"提示","netMgr-网络关闭onClose");
    },

    onMessage: function (commandId, data) {
        var self = cc.vv.netMgr;
        if(data == "pong"){
            self.receivePong = true;
            cc.vv.log(1,data);
            return;
        }
        /*if(data == "ping"){
            self.wsConn.send(3, {cmd:"pong"});
            return;
        }*/
        cc.vv.log(6,"收到消息: ",commandId,JSON.stringify(data));
        
        if (!data.hasOwnProperty('cmd')) {
            console.error("invalid JSON response data, doesn't include cmd");
            return;
        }
        if (!self.cmdHandlers.has(data.cmd)) {
            console.error("unimplemented cmd: ", data.cmd);
            return;
        }
        cc.vv.eventManager.pushEvent(data.cmd,data.result);
        /*var _handler = self.cmdHandlers.get(data.cmd);
        _handler(data.result);*/
    },

    onError: function (evt) { 
        var self = cc.vv.netMgr;
        self.state = netState.failed;
        cc.vv.log(6,"Network ERROR: "+ evt);

        //var xnode = cc.director.getScene().getChildByName("Canvas");
        //cc.vv.prefabMgr.alertOpen(xnode,"提示","netMgr-网络错误onError");
    },
    
    //大厅发送消息
    doSend1: function (c, m) { 
        var packet = {cmd:c, msg:m};
        cc.vv.log(6,"发送消息: " + JSON.stringify(packet));
        this.wsConn.send(1, packet);
    },
    //游戏发送消息
    doSend2: function (c, m) { 
        var packet = {cmd:c, msg:m};
        cc.vv.log(6,"发送消息: " + JSON.stringify(packet));
        this.wsConn.send(2, packet);
    },
    heartBeat : function(){
        var self = cc.vv.netMgr;
        if(self.isClose)return;
        if(self.notActive)return;
        if(self.receivePong == false){
            var node = cc.director.getScene().getChildByName("Canvas");
            cc.vv.prefabMgr.waitOpen(node,"断线重连中");
            self.waitOpen = true;
            self.initLink(function(){
                if(self.waitOpen){
                    cc.vv.prefabMgr.waitClose();
                    self.waitOpen = false;
                }
            });
            return;
        }
        self.wsConn.send(3, {cmd:"ping"});
        self.receivePong = false;
    },

    update : function(){
        if(this.notActive)this.notActive = false;
    },
});
