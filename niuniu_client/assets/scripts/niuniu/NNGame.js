var Chat = require("Chat");
var nnSort = require("NNSort");
cc.Class({
    extends: cc.Component,

    properties: {        
        
    },
    onLoad: function () {
        if(!cc.vv){
            cc.director.loadScene("Loading");
            return;
        }
        cc.vv.nnGame = this;

        this.seats = this.node.getChildByName("seats").getComponent("NNSeats");

        this.nnRoom = this.node.getComponent("NNRoom");
        this.addComponent("Voice");

        this.initView();
        this.initEventHandlers();
        
        //cc.vv.audioMgr.playBGM("bgm1.mp3");
        cc.audioEngine.stopAll();
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.login);
    },
    
    initView:function(){
        //搜索需要的子节点
        //var gameRoot = this.node.getChildByName("game");
        this.seats.init(this);
    },
    isOwner : function(){
        return this.owner == cc.vv.userMgr.userId;  
    },
    getSeatIndexByID:function(userId){
        for(var i = 0; i < this.seatDatas.length; ++i){
            var s = this.seatDatas[i];
            if(s && s.userId == userId){
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
        var ret = index;
        if(index >= 0 && index < this.seatIndex){
            ret = index + 1;
        }
        else if(index == this.seatIndex){
            ret = 0;
        }
        return ret;
    },
    initEventHandlers:function(){
        /*allState = {
            idle : 0,
            qiangzhuang : 1,
            dingzhuang : 2,
            xiazhu : 3,
            chuopai : 4,
        }*/
        this.allRecord = [];
        this.seatDatas = [];
        //初始化事件监听器
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.login_result,function(data){
            if(cc.vv.nnGame == null)return;
            cc.vv.nnGame.login_result = true;
            self.roomId = data.roomId;
            self.owner = data.owner;
            self.conf = data.conf;
            self.maxNumOfGames = data.conf.maxGames;
            self.numOfGames = data.numofgames;
            self.numOfPlayer = data.conf.roomNum;//玩家数量
            self.seatDatas = data.seats;
            self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
            self.difen = data.conf.difen;
            self.gameState = data.gameState;

            console.log(self.gameState);
            if(self.nnRoom._difen){
                self.nnRoom.showDifen();
            }
            if(self.nnRoom._roomId){
                self.nnRoom.showRoomId();
            }
            if(self.nnRoom._numOfGames){
                self.nnRoom.showGameNum();
            }

            for(var i = 0; i <  self.seatDatas.length; ++i){
                var seatData = self.seatDatas[i];
                if(seatData == null){
                    self.seatDatas[i] = {userId : 0,userName:""};
                    continue;
                }
                if(seatData.userId > 0){
                    try {
                        seatData.userName = cc.vv.utils.fromBase64(seatData.userName);
                    } catch (error) {
                        console.log("fromBase64 error");
                    }
                    seatData.holds = [];
                }
            }
            self.seats.initSeats(self.seatDatas);
            for(var i = 0; i <  self.seatDatas.length; ++i){
                var seatData = self.seatDatas[i];
                if(seatData.userId > 0){
                    self.seats.posMove(seatData.userId);
                    if(seatData.kick_time > 0){
                        self.seats.kick(seatData);
                    }
                }
                if(seatData.userId == cc.vv.userMgr.userId){
                    self.sitDown = seatData.sit;
                    self.readyState = seatData.ready;
                }          
            }
            self.nnRoom.refreshBtns();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.new_user,function(data){
            console.log("new_user",data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            console.log("new_user",data);
            var seatIndex = data.seatIndex;
            self.seatDatas[seatIndex] = data;
            self.seatDatas[seatIndex].userName = cc.vv.utils.fromBase64(data.userName);
            if(data.kick_time > 0){
                self.seats.kick(data);
            }
            self.seats.initSingleSeat(data);
            self.seats.posMove(data.userId);
            cc.vv.audioMgr.playSFX("enter.mp3");
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.user_sit,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var seatData = self.getSeatDataByID(data.userId);
            if(seatData == null)return;
            seatData.sit = data.sit;
            if(data.sit && self.conf.maxGames <= 0)self.seats.tickStop(data.userId);
            //self.seats.setOnline(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.user_state,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var seatData = self.getSeatDataByID(data.userId);
            if(seatData == null)return;
            seatData.online = data.online;
            self.seats.setOnline(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.user_ready,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var seatData = self.getSeatDataByID(data.userId);
            if(seatData == null)return;
            seatData.ready = data.ready?true:false;
            self.seats.setReady(data);
            if(self.numOfGames > 0){
                seatData.ready = false;
                data.ready = false;
            }
            else{
                cc.vv.audioMgr.playSFX("ready.mp3");
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.dispress,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            console.log("22222222222dispress",data)
            self.nnRoom.dispress();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.exit_result,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.nnRoom.exit();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.exit_notify,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data;
            self.seats.exit(userId);
            var s = self.getSeatDataByID(userId);
            if(s != null){
                s.userid = 0;
                s.userName = "";
            }
            cc.vv.audioMgr.playSFX("left.mp3");
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_holds,function(data){
            console.log(222222222,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            for(var i=0;i<data.length;i++){
                var seatData = self.getSeatDataByID(data[i].userId);
                if(seatData == null)continue;
                if(data[i].holds){
                    seatData.holds = data[i].holds;
                }
                if(data[i].userId == cc.vv.userMgr.userId){
                    self.sitDown = data[i].sit;
                }
                if(data[i].sit == 1){
                    self.seats.initHolds(seatData);
                }
            }
            /*for(var i = 0; i <  self.seatDatas.length; ++i){
                var seatData = self.seatDatas[i];
                self.seats.initHolds(seatData);
            }*/
            self.seats.fapai(function(){
                if(self.isQiang){
                    if(self.sitDown == 1){
                        self.nnRoom.showQiangzhuang();
                        self.nnRoom.setCountDownDesc("请选择抢庄倍数");
                    }
                    else{
                        self.nnRoom.setCountDownDesc("请等待其他玩家抢庄");
                    }  
                }
            });
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_begin,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.nnRoom.onGameBeign();
            cc.vv.audioMgr.playSFX("didi.mp3","niuniu");

            for(var i = 0; i <  self.seatDatas.length; ++i){
                if(self.seatDatas[i] == null)continue;
                var data = {userId:self.seatDatas[i].userId,ready:false};
                self.seats.setReady(data);
            }
            self.qiangzhuangScore = 0;
            self.dingzhuang = false;
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_sync,function(data){
            console.log(9999999,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.nnRoom.onGameBeign();
            self.gameState = data.gameState;
            if(data.state != 0){
                var j = 0;
                for(var i = 0; i <  data.seats.length; ++i){
                    var seats = data.seats[i];//if(seats == null)continue;
                    var seatData = null;
                    for(var k=j;k<self.seatDatas.length;k++){
                        seatData = self.seatDatas[k];
                        if(seatData == null || seatData.userId != seats.userId)continue;
                        j = k + 1;
                        break;
                    }
                    if(seatData == null || seatData.userId <= 0)continue;
                    seatData.ready = false;
                    if(seats.holds){
                        seatData.holds = seats.holds;
                    }
                    else{
                        seatData.holds = [];
                    }
                    if(seats.sit == 1){
                        if(data.state != 5){
                            self.seats.zhengli(seatData);
                        }
                        self.seats.initHolds(seatData);
                        self.seats.hideBackHolds(seatData);
                    }
                }
            }
            self.seats.initSeats(self.seatDatas);
            /*var state = {
                idle : 0,
                qiangzhuang : 1,
                dingzhuang : 2,
                xiazhu : 3,
                cuopai : 4,
                bipai : 5,
            };*/
            if(data.state == 1){
                if(self.sitDown == 1){
                    self.nnRoom.showQiangzhuang();
                }
            }
            else if(data.state == 2){
                for(var i = 0; i <  data.seats.length; ++i){
                    var seatData = data.seats[i];
                    self.seats.qiangzhuang(seatData.userId,seatData.score1);
                    self.seats.setQiang(seatData.userId);
                    self.seats.setXiazhu(seatData.userId);
                }
            }
            else if(data.state == 3){
                if(self.sitDown == 1 && data.button != cc.vv.userMgr.userId){
                    self.nnRoom.showXiazhu();
                }
            }
            else if(data.state == 5){
                for(var i = 0; i <  data.seats.length; ++i){
                    var seats = data.seats[i];
                    var holds = seats.holds;
                    nnSort.sort(holds);
                    self.seats.showHolds(seats.userId,holds);
                    self.seats.kaipai(seats.userId,seats.niu);
                }
            }
            if(data.state <= 1){
                for(var i = 0; i <  data.seats.length; ++i){
                    var seatData = data.seats[i];
                    self.seats.qiangzhuang(seatData.userId);
                    self.seats.setQiang(seatData.userId);
                    self.seats.setXiazhu(seatData.userId);

                    if(data.state == 0){
                        var data2 = {userId:seatData.userId,ready:seatData.ready};
                        self.seats.setReady(data2);
                        if(seatData.userId == cc.vv.userMgr.userId && seatData.ready == false){
                            self.nnRoom.showReadyBtn();
                        }
                    }
                }
            }

            if(data.state >= 3){
                self.seats.setZhuang(data.button);
                var score1 = 0;
                for(var i = 0; i <  data.seats.length; ++i){
                    var seatData = data.seats[i];
                    if(seatData.userId == data.button){
                        score1 = seatData.score1;
                    }
                    self.seats.qiangzhuang(seatData.userId);

                    if(seatData.score2 > 0){
                        self.seats.setXiazhu(seatData.userId,seatData.score2,true);
                    }
                }
                self.seats.setQiang(data.button,score1);

                if(data.state >= 4 && seatData.hasLiang){
                    self.seats.kanpai(seatData.userId);
                }
            }

            self.allRecord = data.record?data.record:[];
            self.nnRoom.maxRound = self.numOfGames;
            if(data.state != 0)self.nnRoom.maxRound -= 1;
            if(self.nnRoom.currentRound == null || self.nnRoom.currentRound == 0){
                self.nnRoom.currentRound = self.numOfGames;
                if(data.state != 0)self.nnRoom.currentRound -= 1;
            }
            self.nnRoom.refreshRound();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_state,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.gameState = data.state;
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_num,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.numOfGames = data;
            self.nnRoom.showGameNum();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.qiangzhuang_all,function(data){
            console.log(1111,data)
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.nnRoom.countDown = data.time;
            self.isQiang = true;
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.dingzhuang_all,function(data){
            console.log(2222,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.isQiang = false;
            self.dingzhuang = true;
            self.nnRoom.countDown = data.time;
            if(self.qiangzhuangScore == 0){
                self.nnRoom.setCountDownDesc("无人抢庄，随机庄家");
            }
            else{
                self.nnRoom.setCountDownDesc("多人抢庄，随机庄家");
            }
            self.nnRoom.hideOptions();
            
            self.seats.dingzhuang(data.button,data.userArr,function(){
                self.seats.setZhuang(data.button);
            });
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.xiazhu_all,function(data){
            console.log(3333,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.isQiang = false;
            self.nnRoom.countDown = data.time;
            self.buttonBeishu = data.beishu;
            if(self.sitDown == 1 && data.button != cc.vv.userMgr.userId){
                self.nnRoom.showXiazhu();
                self.nnRoom.setCountDownDesc("请选择下注倍数");
            } 
            else{
                self.nnRoom.setCountDownDesc("请等待其他玩家下注");
            }
            self.seats.setQiang(data.button,data.beishu);
            self.seats.setZhuang(data.button);
            for(var i = 0; i <  self.seatDatas.length; ++i){
                var seatData = self.seatDatas[i];
                if(seatData == null)continue;
                self.seats.qiangzhuang(seatData.userId);
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.cuopai_all,function(data){
            console.log(4444,data)
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.nnRoom.countDown = data.time;
            self.nnRoom.setCountDownDesc("查看手牌");
            self.nnRoom.hideOptions();
            self.seats.showHolds(cc.vv.userMgr.userId,data.holds);

            if(self.sitDown == 1){
                self.timeId = setTimeout(function(){
                    var niu = data.niu;
                    var holds = data.holds;
                    nnSort.sort(holds);
                    self.timeId = 0;
                    self.nnRoom.showCuopai(niu,holds);
                },1000);
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.bipai_all,function(data){
            console.log("bipai",data)
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.nnRoom.countDown = data.time;
            self.nnRoom.setCountDownDesc("开始比牌");

            if(self.timeId > 0){
                clearTimeout(self.timeId);
                self.timeId = 0;
            }
            self.nnRoom.hideOptions();
            self.nnRoom.hideCuopai();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.next_all,function(data){
            console.log(5555,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            self.nnRoom.countDown = data.time;
            self.nnRoom.setCountDownDesc("下一局即将开始");
            self.nnRoom.showReadyBtn(); 
            self.seats.stopKaipai();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.qiangzhuang_notify,function(data){
            console.log(6666,data)
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data.userId;
            var value = data.value;
            self.seats.qiangzhuang(userId,value);
            self.qiangzhuangScore = data.value;
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.xiazhu_notify,function(data){
            console.log(7777,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data.userId;
            var value = data.value;
            self.seats.setXiazhu(userId,value);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.kanpai_notify,function(data){
            console.log(88881,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data.userId;
            self.seats.kanpai(userId);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.liangpai_notify,function(data){
            console.log(88882,data);
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var holds = data.holds;
            nnSort.sort(holds);
            self.seats.showHolds(data.userId,holds);
            if(data.sit == 1){
                self.seats.kaipai(data.userId,data.niu);
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.game_over,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            console.log("game_over",data);
            self.gameState = "idle";
            self.nnRoom.doOver(data);
            for(var i = 0; i <  self.seatDatas.length; ++i){
                var seatData = self.seatDatas[i];
                if(seatData == null)continue;
                self.seats.setQiang(seatData.userId);
                self.seats.setXiazhu(seatData.userId);
            }
            for(var i = 0; i <  data.results.length; ++i){
                var result = data.results[i];
                if(result.userId == cc.vv.userMgr.userId){
                    if(result.coins != null)cc.vv.userMgr.coins = result.coins;
                }
                self.seats.addScore({userId:result.userId,score:result.score,coins:result.coins});
            }
                
            self.nnRoom.maxRound = self.numOfGames;
            self.nnRoom.currentRound = self.numOfGames;
            if(self.maxNumOfGames > 0){
                self.allRecord[self.numOfGames] = data.record;
            }
            else{
                self.allRecord = data.record;
            }

            self.nnRoom.refreshRound();
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.chat,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data.sender;
            var content = cc.vv.utils.fromBase64(data.content);
            self.seats.chat(userId,content);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.quick_chat,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data.sender;
            var index = data.content;
            
            var info = Chat.getQuickChatInfo(index);
            
            self.seats.chat(userId,info.content);
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.audioMgr.playSFX(info.sound,"chat",ret.sex);
            });
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.emoji,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data.sender;
            var content = data.content;
            self.seats.emoji(userId,content);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.voice,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId = data.sender;
            var content = data.content;
            self.seats.voiceMsg(userId,content);
            self.nnRoom.voiceMsg(data);
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.magic,function(data){
            if(cc.vv.nnGame == null || cc.vv.nnGame.login_result == null)return;
            var userId1 = data.sender;
            var userId2 = data.receiver;
            var content = data.content;
            self.nnRoom.magic(userId1,userId2,content,function(){
                self.seats.magic(userId2,content);
            });
        });
    },

    getNum :function(){
        var count = 0;
        for(var i = 0; i <  this.seatDatas.length; ++i){
            var seatData = this.seatDatas[i];
            if(seatData && seatData.userId > 0)count += 1;
        }
        return count;
    },
    getWanfa :function(){
        var conf = this.conf;
        if(conf && conf.type){
            var strArr = [];
            if(conf.type == "wd_nn"){
                if(conf.wanfa == 1){
                    strArr.push("看牌抢庄");
                }
                if(conf.maxGames > 0){
                    strArr.push("" + conf.maxGames + "局");
                }
                
                var count = this.getNum();
                strArr.push("人数: " + count + "/" + conf.roomNum);

                if(conf.simi == 1){
                    strArr.push("私密场");
                }
                strArr.push("底分: " + conf.difen);
            }
            return strArr.join("  ");
        }
        return "";
    },

    playSFX:function(name,userId){
        if(userId){
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.audioMgr.playSFX(name,"niuniu",ret.sex);
            });
        }
        else{
            cc.vv.audioMgr.playSFX(name,"niuniu");
        }
    },
    onDestroy:function(){
        cc.vv.nnGame = null;
    }
});
