var Chat = require("Chat");
cc.Class({
    extends: cc.Component,

    properties: {        
        
    },
    
    onLoad: function () {
        if(!cc.sys.isNative && cc.sys.isMobile){
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if(!cc.vv){
            cc.director.loadScene("Loading");
            return;
        }
        cc.vv.mjGame = this;
        var gameBg = cc.sys.localStorage.getItem("gameBg");
        if(gameBg == null){
            gameBg = "green_bg";
        }
        cc.vv.gameBg = gameBg;
        var mjType = cc.sys.localStorage.getItem("mjType");
        if(mjType == null){
            mjType = 2;
        }
        cc.vv.mjType = mjType;

        var zhendong = cc.sys.localStorage.getItem("zhendong")== 0?false:true;
        cc.vv.isFangyin = zhendong;

        var Seats = require("Seats");
        this.seats = new Seats();

        var Pointer = require("Pointer");
        this.pointer = new Pointer();

        var Hands = require("Hands");
        this.hands = new Hands();

        var Folds = require("Folds");
        this.folds = new Folds();

        var PengGangs = require("PengGangs");
        this.pengGangs = new PengGangs();

        this.mjRoom = this.node.getComponent("MJRoom");
        this.addComponent("Voice");

        this.dissolve = this.node.getChildByName("dissolve_notice").getComponent("Dissolve");

        this.initView();
        this.initEventHandlers();
        
        cc.vv.audioMgr.playBGM("bgm1.mp3");
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.login);
    },
    
    initView:function(){
        //搜索需要的子节点
        var gameRoot = this.node.getChildByName("game");

        this.penggangDown = gameRoot.getChildByName("PengGangDown");
        this.penggangRight = gameRoot.getChildByName("PengGangRight");
        this.penggangUp = gameRoot.getChildByName("PengGangUp");
        this.penggangLeft = gameRoot.getChildByName("PengGangLeft");

        this.seats.init(this,this.node.getChildByName("seats"));
        this.pointer.init(this,gameRoot.getChildByName("arrow"));
        var sides = ["down","right","up","left"];
        this.hands.init(this,gameRoot,sides);
        this.folds.init(this,gameRoot,sides);
        this.pengGangs.init(this,gameRoot,sides);
    },
    isOwner : function(){
        return this.owner == cc.vv.userMgr.userId;  
    },
    getSeatIndexByID:function(userId){
        for(var i = 0; i < this.seatDatas.length; ++i){
            var s = this.seatDatas[i];
            if(s.userId == userId){
                return i;
            }
        }
        return -1;
    },
    getSeatDataByID:function(userId){
        var seatIndex = this.getSeatIndexByID(userId);
        var seatData = this.seatDatas[seatIndex];
        return seatData;
    },
    
    getLocalIndex:function(userId){
        var index = this.getSeatIndexByID(userId);
        var ret = (index - this.seatIndex + this.numOfPlayer) % this.numOfPlayer;
        if(this.numOfPlayer == 2){
            if(ret == 1)ret = 2;
        }
        else if(this.numOfPlayer == 3){
            if(ret == 2)ret = 3;
        }
        return ret;
    },
    initEventHandlers:function(){
        //初始化事件监听器
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.login_result,function(data){
            self.roomId = data.roomId;
            self.owner = data.owner;
            self.conf = data.conf;
            self.maxNumOfGames = data.conf.maxGames;
            self.numOfGames = data.numofgames;
            self.numOfPlayer = data.conf.roomNum;//玩家数量
            self.seatDatas = data.seats;
            self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
            self.isOver = false;

            if(self.mjRoom._roomId){
                self.mjRoom.showRoomId();
            }
            if(self.mjRoom._numOfGames){
                self.mjRoom.showGameNum();
            }
            for(var i = 0; i <  self.seatDatas.length; ++i){
                var seatData = self.seatDatas[i];
                seatData.userName = cc.vv.utils.fromBase64(seatData.userName);
                seatData.folds = [];
                seatData.penggangs = [];
                seatData.hued = false; 
            }
            self.seats.initSeats(self.seatDatas);
            self.mjRoom.refreshBtns();
            var wanfa = self.getWanfa();
            self.mjRoom.showWanfa(wanfa);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.new_user,function(data){
            var seatIndex = data.seatIndex;
            self.seatDatas[seatIndex] = data;
            self.seatDatas[seatIndex].userName = cc.vv.utils.fromBase64(data.userName);
            self.seatDatas[seatIndex].folds = [];
            self.seatDatas[seatIndex].penggangs = [];
            self.seatDatas[seatIndex].hued = false; 
            self.seats.initSingleSeat(data);
            cc.vv.audioMgr.playSFX("enter.mp3");
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.user_state,function(data){
            var seatData = self.getSeatDataByID(data.userId);
            if(seatData == null)return;
            seatData.online = data.online;
            self.seats.setOnline(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.user_ready,function(data){
            var seatData = self.getSeatDataByID(data.userId);
            seatData.ready = data.ready?true:false;
            if(self.gameState == "playing"){
                seatData.ready = false;
                data.ready = false;
            }
            else{
                self.seats.setReady(data);
                cc.vv.audioMgr.playSFX("ready.mp3");
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.dispress,function(data){
            self.mjRoom.gotoHall();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.exit_result,function(data){
            self.mjRoom.gotoHall();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.exit_notify,function(data){
            var userId = data;
            self.seats.exit(userId);
            var s = self.getSeatDataByID(userId);
            if(s != null){
                s.userid = 0;
                s.name = "";
            }
            cc.vv.audioMgr.playSFX("left.mp3");
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_holds,function(data){
            for(var i=0;i<data.length;i++){
                var seatData = self.getSeatDataByID(data[i].userId);
                if(seatData && data[i].holds){
                    seatData.holds = data[i].holds;
                }
            }  
            self.hands.resume();
            for(var i=0;i<self.seatDatas.length;i++){
                var seatData = self.seatDatas[i];
                self.hands.initMahjongs(seatData);
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_begin,function(data){
            self.gameState = "playing";
            self.button = data;
            self.turn = data;
            self.mjRoom.onGameBeign();
            
            for(var i = 0; i <  self.seatDatas.length; ++i){
                var data = {userId:self.seatDatas[i].userId,ready:false};
                self.seats.setReady(data);
                self.seatDatas[i].folds = [];
                self.seatDatas[i].penggangs = [];
                self.seatDatas[i].hued = false;
            }
            self.seats.setZhuang(self.seatDatas[self.button].userId);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_sync,function(data){
            self.gameState = data.state;
            self.numOfMJ = data.numofmj;
            self.turn = data.turn;
            self.button = data.button;
            self.chupai = data.chuPai;
            for(var i = 0; i < data.seats.length; ++i){
                var seat = self.seatDatas[i];
                var sd = data.seats[i];
                seat.holds = sd.holds;
                seat.folds = sd.folds;
                seat.penggangs = sd.penggangs;
                seat.hued = sd.hued; 
                seat.que = sd.que;
                seat.iszimo = sd.iszimo;
                if(i == self.seatIndex){
                    self.que = sd.que;
                }
            }
            if(data.seats[self.seatIndex].tianTing){
                self.mjRoom.tianTing();
            }
            if(data.seats[self.seatIndex].isTianTing){
                self.hands.tianTing();
            }
            self.mjRoom.onGameBeign();
            self.mjRoom.showMJCount();
            self.seats.initSeats(self.seatDatas);
            for(var i = 0; i <  self.seatDatas.length; ++i){
                var seatData = self.seatDatas[i];
                var data = {userId:seatData.userId,ready:false};
                self.seats.setReady(data);
                if(seatData.penggangs.length > 0){
                    self.pengGangs.onPengGangChanged(seatData);
                }
            }
            self.seats.setZhuang(self.seatDatas[self.button].userId);
            self.hands.initAllMahjongs(self.seatDatas);
            self.folds.initAllFolds(self.seatDatas);
            self.pointer.initPointer(self.seatDatas[self.turn].userId);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_tianTing,function(data){
            if(data == cc.vv.userMgr.userId){
                self.hands.tianTing();
            }
            self.seats.tianTing(data,true);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_state,function(data){
            self.gameState = data.state;
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_num,function(data){
            self.numOfGames = data;
            self.mjRoom.showGameNum();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.mj_count,function(data){
            self.numOfMJ = data;
            self.mjRoom.showMJCount();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_dingque,function(data){
            self.gameState = "playing";
            self.mjRoom.dingque();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.result_dingque,function(data){
            for(var i = 0; i <  data.length; ++i){
                var userId = data[i].userId;
                var que = data[i].que;
                self.seats.dingque(userId,que);
                if(userId == cc.vv.userMgr.userId){
                    self.que = que;
                    var seatData = self.getSeatDataByID(userId);
                    self.hands.initMahjongs(seatData);
                }
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_chupai,function(data){
            self.chupai = -1;
            var index = self.getSeatIndexByID(data);
            self.turn = index;
            self.mjRoom.hideChupai();
            self.mjRoom.hideOptions();
            self.pointer.initPointer(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_chupai_notify,function(data){
            var userId = data.userId;
            var pai = data.pai;
            self.chupai = pai;
            var seatData = self.getSeatDataByID(userId);
            if(seatData.holds){  
                var idx = seatData.holds.indexOf(pai);
                seatData.holds.splice(idx,1);
            }
            self.mjRoom.showChupai(data);
            self.hands.initMahjongs(seatData);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.guo_notify,function(data){
            self.chupai = -1;
            var seatData = self.getSeatDataByID(data.userId);
            seatData.folds.push(data.pai);
            self.folds.chupai(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_mopai,function(data){
            var seatData = self.seatDatas[self.turn];
            if(data >= 0){
                var holds = seatData.holds;
                holds.push(data);
            }
            self.hands.initMahjongs(seatData);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_action,function(data){
            self.mjRoom.showAction(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.chi_notify,function(data){
            var userId = data.userId;
            var chipai = data.chipai;   //{index:1,chi:[],pai:2}
            var seatData = self.getSeatDataByID(userId);
            if(seatData.holds){
                for(var i = 0; i < chipai.chi.length; ++i){
                    if(chipai.chi[i] == chipai.pai)continue;
                    var idx = seatData.holds.indexOf(chipai.chi[i]);
                    seatData.holds.splice(idx,1);
                }                
            }
            //更新碰牌数据
            var penggangs = seatData.penggangs;
            penggangs.push(["chi",chipai]);

            self.hands.initMahjongs(seatData);
            self.mjRoom.doChi(data);
            self.pengGangs.onPengGangChanged(seatData);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.peng_notify,function(data){
            var userId = data.userId;
            var pai = data.pai;
            var seatData = self.getSeatDataByID(userId);
            if(seatData.holds){
                for(var i = 0; i < 2; ++i){
                    var idx = seatData.holds.indexOf(pai);
                    seatData.holds.splice(idx,1);
                }                
            }
            //更新碰牌数据
            var penggangs = seatData.penggangs;
            penggangs.push(["peng",pai]);

            self.hands.initMahjongs(seatData);
            self.mjRoom.doPeng(data);
            self.pengGangs.onPengGangChanged(seatData);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.gang_notify,function(data){
            var userId = data.userId;
            var pai = data.pai;
            var seatData = self.getSeatDataByID(userId);
            if(seatData.holds){
                for(var i = 0; i <= 4; ++i){
                    var idx = seatData.holds.indexOf(pai);
                    if(idx == -1){
                        //如果没有找到，表示移完了，直接跳出循环
                        break;
                    }
                    seatData.holds.splice(idx,1);
                }                
            }
            //更新杠牌数据
            if(data.gangtype == "wangang"){
                for(var i=0;i<seatData.penggangs.length;i++){
                    if(seatData.penggangs[i][0] == "peng" && seatData.penggangs[i][1] == pai){
                        seatData.penggangs[i][0] = "wangang";
                        break;
                    }
                }   
            }
            else if(data.gangtype == "angang"){
                seatData.penggangs.push(["angang",pai]);
            }
            else if(data.gangtype == "diangang"){
                seatData.penggangs.push(["diangang",pai]);
            }

            self.hands.initMahjongs(seatData);
            self.pengGangs.onPengGangChanged(seatData);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.hangang_notify,function(data){
            self.mjRoom.doGang(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_ting,function(data){
            if(data.tianTing){
                self.mjRoom.tianTing();
                return;
            }
            self.mjRoom.showTing(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_over,function(data){
            if(data.endInfo){
                self.isOver = true;
            }
            self.gameState = "end";
            self.mjRoom.doOver(data);
            for(var i = 0; i <  self.seatDatas.length; ++i){
                self.seatDatas[i].folds = [];
                self.seatDatas[i].penggangs = [];
                self.seatDatas[i].hued = false;
            }
            self.pointer.stop();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_hupai,function(data){
            self.mjRoom.doHu(data);
            if(data.fanji >= 0){
                self.mjRoom.showFanji(data);
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.dissolve_notice,function(data){
            self.dissolve.showDissolveNotice(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.dissolve_cancel,function(data){
            self.dissolve.hideDissolveNotice();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.chat,function(data){
            var userId = data.sender;
            var content = cc.vv.utils.fromBase64(data.content);
            self.seats.chat(userId,content);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.quick_chat,function(data){
            var userId = data.sender;
            var index = data.content;
            
            var info = Chat.getQuickChatInfo(index);
            
            self.seats.chat(userId,info.content);
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.audioMgr.playSFX(info.sound,"chat",ret.sex);
            });
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.emoji,function(data){
            var userId = data.sender;
            var content = data.content;
            self.seats.emoji(userId,content);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.voice,function(data){
            var userId = data.sender;
            var content = data.content;
            self.seats.voiceMsg(userId,content);
            self.mjRoom.voiceMsg(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.chongfengji,function(data){
            self.mjRoom.chongfengji(data);
        });
    },
    getWanfa :function(){
        var conf = this.conf;
        if(conf && conf.type){
            var strArr = [];
            strArr.push("" + conf.maxGames + "局");
            if(conf.type == "gy_mj"){
                if(conf.roomNum == 2){
                    strArr.push("二丁拐");
                }
                else if(conf.roomNum == 3){
                    strArr.push("三丁拐");
                }
                else if(conf.roomNum == 4){
                    strArr.push("四人局");
                }

                if(conf.jiType == 1){
                    strArr.push("翻牌鸡");
                }
                else if(conf.jiType == 2){
                    strArr.push("摇摆鸡");
                }

                if(conf.zhuang == 1){
                    strArr.push("一扣二");
                }
                else if(conf.zhuang == 2){
                    strArr.push("连庄");
                }

                if(conf.mantangji == 1){
                    strArr.push("满堂鸡");
                }
                if(conf.benji == 1){
                    strArr.push("本鸡");
                }
                if(conf.wuguji == 1){
                    strArr.push("乌骨鸡");
                }
                if(conf.huanleji == 1){
                    strArr.push("欢乐鸡");
                }
            }
            return strArr.join(" ");
        }
        return "";
    },
    onDestroy:function(){
        cc.vv.mjGame = null;
    }
});
