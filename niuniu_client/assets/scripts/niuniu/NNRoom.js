var nnSort = require("NNSort");
cc.Class({
    extends: cc.Component,

    properties: {
        _seatsPosition1 : [],
        _seatsPosition2 : [],
        _options : null,
        _interval : 0,
        
        _game_result: null,
        _voiceMsgQueue:[],
        _playingCount:0,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        this._interval = 1;
        this.nnGame = this.node.getComponent("NNGame");
        this.initView();

        var self = this;
        this.backListener = cc.EventListener.create({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (keyCode, event) {
                cc.log('pressed key: ' + keyCode);
            },
            onKeyReleased: function (keyCode, event) {
                cc.log('released key: ' + keyCode);
                var isIdle = self.nnGame.numOfGames == 0;
                if((keyCode == cc.KEY.back||keyCode == cc.KEY.escape)&&isIdle){
                    if(self.nnGame.isOwner()){
                        cc.vv.prefabMgr.alertOpen(self.node,"解散房间","确定解散房间？",function(){
                            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dispress);
                        },true);
                    }
                    else{
                        cc.vv.prefabMgr.alertOpen(self.node,"退出房间","确定退出房间？",function(){
                            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.exit);
                        },true);
                    }
                }
            }
        });
        cc.eventManager.addListener(this.backListener,100);
    },
    
    initView:function(){
        this.gameRoot = this.node.getChildByName("game");
        this.prepareRoot = this.node.getChildByName("prepare");
        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        
        var opts = this.gameRoot.getChildByName("ops");
        this._options = opts;
        this.hideOptions();


        this._game_result = this.node.getChildByName("game_result").getComponent("NNResult");
        this._game_result.init();
        this._game_result.node.active = false;

        this._roomId = this.node.getChildByName("roomInfo").getChildByName("roomId").getComponent(cc.Label);
        if(this.nnGame.roomId){
            this.showRoomId();
        }
        this._numOfGames = this.node.getChildByName("roomInfo").getChildByName("numOfGame").getComponent(cc.Label);
        if(this.nnGame.maxNumOfGames){
            this.showGameNum();
        }
        this._time = this.node.getChildByName("roomInfo").getChildByName("time").getComponent(cc.Label);

        this._difen = this.node.getChildByName("roomInfo").getChildByName("difen").getComponent(cc.Label);
        if(this.nnGame.difen){
            this.showDifen();
        }

        this.countDown = 0;
        var countDown = this.gameRoot.getChildByName("countDown"); 
        this._countDownSecond = countDown.getChildByName("second").getComponent(cc.Label);
        this._countDownDesc = countDown.getChildByName("desc").getComponent(cc.Label);

        var seats = this.nnGame.seats;
        var onTouchDown = function(event){
            nnRoom.node.canTouch = false;
            if(this.canTouch == false)return;
            this.backPos = this.getChildByName("back").getPosition();
            if(this.startPos)return;
            this.startPos = event.getLocation();
            
        }
        var nnRoom = this;
        var onTouchMove = function(event){
            if(this.canTouch == false)return;
            var pos = event.getLocation();
            var distanceX = pos.x - this.startPos.x + this.backPos.x;
            var distanceY = pos.y - this.startPos.y + this.backPos.y;

            this.getChildByName("back").x = distanceX;
            this.getChildByName("back").y = distanceY;
            if(Math.abs(distanceX) > 180 || Math.abs(distanceY) > 320){
                if(distanceY < -320){
                    pos = cc.p(distanceX,-1280);
                }
                if(distanceX < -180){
                    pos = cc.p(-720,distanceY);
                }
                if(distanceY > 320){
                    pos = cc.p(distanceX,1280);
                }
                if(distanceX > 180){    
                    pos = cc.p(720,distanceY);
                }
                this.startPos = null;
                this.canTouch = false;
                var self = this;
                this.getChildByName("back").runAction(cc.sequence(cc.moveBy(0.3,pos),cc.delayTime(0.5),cc.callFunc(function(){
                    self.getChildByName("back").x = 0;
                    self.getChildByName("back").y = 0;
                    self.canTouch = true;
                    self.active = false;
                    cc.vv.netMgr.doSend2(cc.vv.netMgr.req.kanpai);
                    //seats.showHolds(cc.vv.userMgr.userId,nnRoom.holds);
                    //seats.kaipai(cc.vv.userMgr.userId,nnRoom.niuniu);
                    seats.kanpai2();
                    if(nnRoom.cuopaiId > 0){
                        cc.audioEngine.stop(nnRoom.cuopaiId);
                        nnRoom.cuopaiId = -1;
                    }
                })));
                var value1 = this.getChildByName("front").getChildByName("value1");
                var value2 = this.getChildByName("front").getChildByName("value2");
                value1.active = true;
                value2.active = true;
                value1.runAction(cc.fadeIn(0.5));
                value2.runAction(cc.fadeIn(0.5));
            }

        }
        var onTouchEnd = function(event){
            nnRoom.node.canTouch = true;
            if(this.canTouch == false)return;
            this.startPos = null;
        }
        var onTouchCancel = function(event){
            nnRoom.node.canTouch = true;
            if(this.canTouch == false)return;
            this.startPos = null;
        }
        this.cuopai = this.node.getChildByName("cuopai");
        var back = this.cuopai.getChildByName("back");
        back.on(cc.Node.EventType.TOUCH_START, onTouchDown, this.cuopai);
        back.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove, this.cuopai);
        back.on(cc.Node.EventType.TOUCH_END, onTouchEnd, this.cuopai);
        back.on(cc.Node.EventType.TOUCH_CANCEL, onTouchCancel,this.cuopai);
        this.cuopai.active = false;


        this.node.on(cc.Node.EventType.TOUCH_START, function(event){
            if(this.canTouch == false)return;
            this.startPos = event.getLocation();
        }, this.node);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function(event){
            if(this.canTouch == false)return;
            var pos = event.getLocation();
            var distanceX = pos.x - this.startPos.x;
            
            if(distanceX > 360)distanceX = 360;
            if(distanceX < -360)distanceX = -360;
            this.x = distanceX;
        }, this.node);
        this.node.on(cc.Node.EventType.TOUCH_END, function(){
            if(this.canTouch == false)return;
            
            this.canTouch = false;
            var self = this;
            if(this.x < -100){
                this.runAction(cc.sequence(cc.moveTo(0.15,cc.p(-360,0)),cc.callFunc(function(){
                    self.canTouch = true;
                    self.getChildByName("block").active = true;
                })));
            }
            else if(this.x > 100){
                this.runAction(cc.sequence(cc.moveTo(0.15,cc.p(360,0)),cc.callFunc(function(){
                    self.canTouch = true;
                    self.getChildByName("block").active = true;
                })));
            }
            else{
                this.runAction(cc.sequence(cc.moveTo(0.15,cc.p(0,0)),cc.callFunc(function(){
                    self.canTouch = true;
                })));
            }
        }, this.node);

        this.lastRound = this.node.getChildByName("lastRound");
        var children = this.lastRound.children;
        for(var i=0;i<children.length;i++){
            children[i].active = false;
        }
    },
    
    moveBack : function(){
        var self = this.node;
        this.node.runAction(cc.sequence(cc.moveTo(0.15,cc.p(0,0)),cc.callFunc(function(){
            self.canTouch = true;
            self.getChildByName("block").active = false;
        })));
    },
    refreshBtns:function(){
        if(this.nnGame.sitDown == 1){
            this.node.getChildByName("sit").active = false;
            this.node.getChildByName("ready").active = this.nnGame.gameState != "playing";
        }
        else{
            this.node.getChildByName("sit").active = true;
            this.node.getChildByName("ready").active = false;
        }
        if(this.nnGame.numOfGames > 0){
            this.prepareRoot.active = false;
        }
    },
    showReadyBtn:function(){
        if(this.nnGame.sitDown == 0)return;
        this.node.getChildByName("ready").active = true;
    },
    showRoomId:function(){
        this._roomId.string = "" + this.nnGame.roomId;
    },
    showDifen:function(){
        this._difen.string = "底分 : " + this.nnGame.difen;
    },
    showGameNum:function(){
        if(this.nnGame.maxNumOfGames > 0){
           this._numOfGames.string = "第 " + this.nnGame.numOfGames + "/" + this.nnGame.maxNumOfGames + " 轮";
        }
        else{
            this._numOfGames.string = "";
        }
    },
    setCountDownDesc:function(desc){
        this._countDownDesc.string = desc;
        this._countDownDesc.node.parent.active = true;
    },
    
    onGameBeign:function(){
        cc.audioEngine.stopAll();
        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        this.node.getChildByName("ready").active = false;
        this._countDownSecond.node.parent.active = false;

        //this._time.node.y = 580;
        this.nnGame.seats.setZhuang(0);
        this.nnGame.seats.stopDingzhuang();
        this.nnGame.seats.hideAllHolds();
        
        this.hideOptions();
        this.hideCuopai();
    },
    onReady:function(){
        this.node.getChildByName("ready").active = false;
        if(this.nnGame.numOfGames <= 0)return;
        this.gameRoot.active = true;
        this.prepareRoot.active = false;

        //this._time.node.y = 580;
        this.nnGame.seats.setZhuang(0);
        this.nnGame.seats.hideAllHolds();
        this.nnGame.seats.stopDingzhuang();
    },
    onRoundClick : function(event){
        if(this.nnGame.maxNumOfGames > 0){
            if(event.target.name == "left"){
                if(this.currentRound <= 1)return;
                this.currentRound -= 1;
            }
            else if(event.target.name == "right"){
                if(this.currentRound >= this.maxRound)return;
                this.currentRound += 1;
            }
            this.refreshRound();
        }
    },
    refreshRound : function(){
        if(this.maxRound >= 1){
            this.node.getChildByName("round2").active = true;
        }
        var roundLabel = this.node.getChildByName("round2").getChildByName("round2").getComponent(cc.Label);
        var record = [];
        if(this.nnGame.maxNumOfGames > 0){
            record = this.nnGame.allRecord[this.currentRound];
            roundLabel.string = "" + this.currentRound + "/" + this.maxRound;
        }
        else{
            record = this.nnGame.allRecord;
            roundLabel.string = "" + this.currentRound;
        }
        
        if(record == null){
            console.error(" nnGame.allRecord data error");
            return;
        }
        this.showLastRound(record);
    },
    showLastRound : function(data){
        var index = 0;
        var children = this.lastRound.children;
        for(var i=0;i<children.length;i++){
            children[i].active = false;
        }
        var item = children[index];
        var loadsync = function(userId,sprite,name){
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,sprite);
                name.string = cc.vv.utils.cutString(ret.userName,9);
            },sprite,name);
        }
        for(var userId in data){
            var userData = data[userId];
            if(userData == null)continue;
            if(userData.score == null || userData.holds == null || userData.niu == null)continue;
            nnSort.sort(userData.holds);
            var seat = children[index];
            if(seat == null){
                seat = cc.instantiate(item);
                this.lastRound.addChild(seat);
            }
            seat.active = true;
            index += 1;
            var sprite = seat.getChildByName("frame").getChildByName("icon").getComponent(cc.Sprite);
            var name = seat.getChildByName("frame").getChildByName("name").getComponent(cc.Label);

            loadsync(userId,sprite,name);
            
            var zhuang = seat.getChildByName("frame").getChildByName("zhuang");
            zhuang.active = userData.isZhuang == true;
            seat.setLocalZOrder(userData.isZhuang?1:2);

            var win = seat.getChildByName("frame").getChildByName("win").getComponent(cc.Label);
            var lose = seat.getChildByName("frame").getChildByName("lose").getComponent(cc.Label);
            if(userData.score >= 0){
                win.node.active = true;
                lose.node.active = false;
                win.string = "+" + userData.score;
            }
            else {
                win.node.active = false;
                lose.node.active = true;
                lose.string = "" + userData.score;
            }
            
            var children2 = seat.getChildByName("holds").children;
            for(var i = 0; i < userData.holds.length; ++i){
                var sprite2 = children2[i].getComponent(cc.Sprite);
                var hold = userData.holds[i];
                if(hold == -1){
                    continue;
                }
                
                var value = Math.floor(hold / 10);
                var type = hold % 10;
    
                var name1 = "";
                if(value == 11){
                    name1 = "J";
                }
                else if(value == 12){
                    name1 = "Q";
                }
                else if(value == 13){
                    name1 = "K";
                }
                else{
                    name1 = "" + value;
                }
                name1 += type;

                sprite2.spriteFrame = this.nnGame.seats.pukerAtlas.getSpriteFrame(name1);
            }
            var niuSprite = seat.getChildByName("holds").getChildByName("niu").getComponent(cc.Sprite);
            var niu = userData.niu;
            var niu1 = niu;
            if(niu < 0)niu1 = 0;
            niuSprite.spriteFrame = this.nnGame.seats.allNiu[niu1];
        }
    },
    onSit:function(){
        this.node.getChildByName("sit").active = false;
        var seatData = this.nnGame.getSeatDataByID(cc.vv.userMgr.userId);
        seatData.sit = 1;
        this.nnGame.seats.onSit();
        this.node.getChildByName("ready").active = this.nnGame.gameState != "playing";
        if(this.nnGame.numOfGames > 0){
            this.nnGame.seats.tickStop(cc.vv.userMgr.userId);
        }
    },
    showQiangzhuang : function(){
        this._options.active = true;
        var qiangzhuang = this._options.getChildByName("qiangzhuang");
        var xiazhu = this._options.getChildByName("xiazhu");
        //var liangpai = this._options.getChildByName("liangpai");
        qiangzhuang.active = true;
        xiazhu.active = false;
        //liangpai.active = false;
        var count = this.nnGame.getNum();
        var maxValue = Math.floor(cc.vv.userMgr.coins / (this.nnGame.difen * (count-1) * 5 * 5));
        if(maxValue < 4){
            qiangzhuang.getChildByName("sibei").getComponent(cc.Button).interactable = false;
        }
        else{
            qiangzhuang.getChildByName("sibei").getComponent(cc.Button).interactable = true;
        }
        if(maxValue < 3){
            qiangzhuang.getChildByName("sanbei").getComponent(cc.Button).interactable = false;
        }
        else{
            qiangzhuang.getChildByName("sanbei").getComponent(cc.Button).interactable = true;
        }
        if(maxValue < 2){
            qiangzhuang.getChildByName("erbei").getComponent(cc.Button).interactable = false;
        }
        else{
            qiangzhuang.getChildByName("erbei").getComponent(cc.Button).interactable = true;
        }
        if(maxValue < 1){
            qiangzhuang.getChildByName("yibei").getComponent(cc.Button).interactable = false;
        }
        else{
            qiangzhuang.getChildByName("yibei").getComponent(cc.Button).interactable = true;
        }
        qiangzhuang.getComponent(cc.Animation).sample();
        qiangzhuang.getComponent(cc.Animation).play();
        /*if(maxValue >= 4){
            var anim = qiangzhuang.getComponentInChildren(cc.Animation);
            anim.node.active = false;
            setTimeout(function(){
                anim.node.active = true;
                anim.play();
            },170);
        }*/
    },
    showXiazhu : function(){
        this._options.active = true;
        var qiangzhuang = this._options.getChildByName("qiangzhuang");
        var xiazhu = this._options.getChildByName("xiazhu");
        //var liangpai = this._options.getChildByName("liangpai");
        qiangzhuang.active = false;
        xiazhu.active = true;
        //liangpai.active = false;
        var maxValue = Math.floor(cc.vv.userMgr.coins / (this.nnGame.difen * this.nnGame.buttonBeishu * 5));
        if(maxValue < 5){
            xiazhu.getChildByName("wubei").getComponent(cc.Button).interactable = false;
        }
        else{
            xiazhu.getChildByName("wubei").getComponent(cc.Button).interactable = true;
        }
        if(maxValue < 4){
            xiazhu.getChildByName("sibei").getComponent(cc.Button).interactable = false;
        }
        else{
            xiazhu.getChildByName("sibei").getComponent(cc.Button).interactable = true;
        }
        if(maxValue < 3){
            xiazhu.getChildByName("sanbei").getComponent(cc.Button).interactable = false;
        }
        else{
            xiazhu.getChildByName("sanbei").getComponent(cc.Button).interactable = true;
        }
        if(maxValue < 2){
            xiazhu.getChildByName("erbei").getComponent(cc.Button).interactable = false;
        }
        else{
            xiazhu.getChildByName("erbei").getComponent(cc.Button).interactable = true;
        }
        xiazhu.getComponent(cc.Animation).sample();
        xiazhu.getComponent(cc.Animation).play();
        /*if(maxValue >= 5){
            var anim = xiazhu.getComponentInChildren(cc.Animation);
            anim.node.active = false;
            setTimeout(function(){
                anim.node.active = true;
                anim.play();
            },170);
        }*/
    },
    showCuopai :function(niu,holds){
        this.cuopai.active = true;
        var node = this.cuopai;
        var value1 = node.getChildByName("front").getChildByName("value1");
        var value2 = node.getChildByName("front").getChildByName("value2");
        value1.active = false;
        value2.active = false;
        if(this.cuopaiId > 0){
            cc.audioEngine.stop(this.cuopaiId);
            this.cuopaiId = -1;
        }
        //this.niuniu = niu;
        //this.holds = holds;
        this.cuopaiId = cc.vv.audioMgr.playSFX("cuopai.mp3","niuniu",null,true);
        node.getChildByName("effect").getComponent(cc.Animation).play();
        this.cuopai.canTouch = true;

        this.node.getChildByName("liangpai").active = true;
    },
    hideCuopai:function(){
        this.node.getChildByName("liangpai").active = false;

        var node = this.cuopai;
        node.active = false;
        var value1 = node.getChildByName("front").getChildByName("value1");
        var value2 = node.getChildByName("front").getChildByName("value2");
        value1.stopAllActions();
        value2.stopAllActions();
        var back = node.getChildByName("back");
        back.stopAllActions();
        back.x = 0;
        back.y = 0;    
        node.getChildByName("effect").getComponent(cc.Animation).stop();
        cc.audioEngine.stopAll();
        /*if(this.cuopaiId > 0){
            cc.audioEngine.stop(this.cuopaiId);
            this.cuopaiId = -1;
        }*/
    },
    hideOptions:function(){
        this._options.active = false;
        var qiangzhuang = this._options.getChildByName("qiangzhuang");
        var xiazhu = this._options.getChildByName("xiazhu");
        var liangpai = this._options.getChildByName("liangpai");
        qiangzhuang.active = false;
        xiazhu.active = false;
        liangpai.active = false;
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
    
    doOver : function(overData){
        this.hideOptions();
        var self = this;
        var isOver = overData.endInfo;
        if(isOver){
            cc.vv.netMgr.close();
            var self = this;
            setTimeout(function(){
                self._game_result.onGameOver(self.nnGame,isOver,overData.endTime);
            },1000);
        }
    },
    
    onBtnSettingsClicked:function(){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        cc.vv.prefabMgr.settingOpen(this.node);
    },

    gotoHall:function(){
        cc.vv.netMgr.wsUri = cc.vv.netMgr.hallUrl;
        cc.vv.netMgr.initLink(function(){
            cc.director.loadScene("Hall");
        });
    },
    dispress:function(){
        cc.vv.netMgr.close();
        var self = this;
        cc.vv.prefabMgr.alertOpen(self.node,"解散房间","房间已经解散",function(){
            self.gotoHall();
        });
    },
    exit:function(){
        cc.vv.netMgr.close();
        this.gotoHall();
        /*var self = this;
        cc.vv.prefabMgr.alertOpen(self.node,"退出房间","退出房间",function(){
            self.gotoHall();
        });*/
    },

    onBtnClick : function(event){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        var name = event.target.name;
        if(name == "menuBtn"){
            cc.vv.prefabMgr.settingOpen(this.node);
        }
        else if(name == "emoji"){
            this.node.canTouch = false;
            var node = this.node.getChildByName("chat");
            node.active = true;
            var bg = node.getChildByName("bg");
            bg.active = false;
            node.setPosition(cc.p(0,-500));
            node.runAction(cc.sequence(cc.moveTo(0.15,cc.p(0,0)),cc.callFunc(function(){
                bg.active = true;
            })));
            node.getComponent("Chat").onTabSelete("tabEmoji");
        }
        else if(name == "chat"){
            this.node.canTouch = false;
            var node = this.node.getChildByName("chat");
            node.active = true;
            var bg = node.getChildByName("bg");
            bg.active = false;
            node.setPosition(cc.p(0,-500));
            node.runAction(cc.sequence(cc.moveTo(0.15,cc.p(0,0)),cc.callFunc(function(){
                bg.active = true;
            })));
            node.getComponent("Chat").onTabSelete("tabQuick");
        }
        else if(name == "back"){
            var seatData = this.nnGame.getSeatDataByID(cc.vv.userMgr.userId);
            if(seatData.sit == 1){
                if(this.nnGame.conf.maxGames > 0){
                    cc.vv.prefabMgr.alertOpen(this.node,"退出房间","游戏中无法退出游戏");
                }
                else{
                    var content = "确定退出游戏？";
                    if(this.nnGame.gameState == "playing"){
                        content = "确定本轮结束后退出游戏？";
                    }
                    cc.vv.prefabMgr.alertOpen(this.node,"退出房间",content,function(){
                        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.exit);
                    },true);
                }
                
                
            }
            if(this.nnGame.isOwner() && this.nnGame.numOfGames == 0){
                cc.vv.prefabMgr.alertOpen(this.node,"解散房间","确定解散房间？",function(){
                    cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dispress);
                },true);
            }
            else{
                cc.vv.prefabMgr.alertOpen(this.node,"退出房间","确定退出房间？",function(){
                    cc.vv.netMgr.doSend2(cc.vv.netMgr.req.exit);
                },true);
            }
        }
        else if(name == "ready"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.ready,1);
            this.onReady();
        }
        else if(name == "sit"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.sitDown);
            this.onSit();
        }
        else if(name == "invite" || name == "friend"){
            var wanfa = this.nnGame.getWanfa();
            console.log(wanfa,cc.vv.http.shareWeb + "/?roomId=" + this.nnGame.roomId)
            cc.vv.anysdkMgr.share(cc.vv.http.shareWeb + "/?roomId=" + this.nnGame.roomId,cc.vv.entrance.name + " [房间号 : " + this.nnGame.roomId  + "]",wanfa,1);
        }
        else if(name == "circle"){
            cc.vv.anysdkMgr.share(cc.vv.http.shareWeb + "/?roomId=" + this.nnGame.roomId,cc.vv.entrance.name,wanfa,2);
        }
    },
    onIconCloseClick : function(event){
        var magic = this.node.getChildByName("magic");
        magic.active = false;
    },
    onIconClick : function(event){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        var nnUser = event.target.parent.parent.getComponent("NNUser");
        var userId = nnUser._userInfo.userId;
        console.log(userId)
        var magic = this.node.getChildByName("magic");
        magic.active = true;
        this.magicUserId = userId;
        var icon = magic.getChildByName("icon").getComponent(cc.Sprite);
        var name = magic.getChildByName("name").getComponent(cc.Label);
        var id = magic.getChildByName("userId").getComponent(cc.Label);
        id.string = "" + userId;
        cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
            cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,icon);
            name.string = cc.vv.utils.cutString(ret.userName,12);
        },icon,name);
    },
    onMagicClick : function(event){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        var name = event.target.name;
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.magic,{userId:this.magicUserId,content:name});
    },
    magic : function(userId1,userId2,content,callback){
        this.onIconCloseClick();
        var magic2 = this.node.getChildByName("magic2");
        magic2.active = true;
        var magicNode = null;
        for(var i=0;i<magic2.children.length;i++){
            var node = magic2.children[i];
            if(node.name == content){
                magicNode = node;
                node.active = true;
            }
            else {
                node.active = false;
            }
        }
        if(magicNode == null)return;
        if(this.magicUserId == userId1){
            magicNode.active = false;
            callback();
            return;
        }
        var index1 = this.nnGame.getLocalIndex(userId1);
        var index2 = this.nnGame.getLocalIndex(userId2);

        var seats = this.nnGame.seats.seats;
        var node1 = seats[index1].node;
        var node2 = seats[index2].node;
        var pos1 = node1.getPosition();
        var pos2 = node2.getPosition();
        magicNode.stopAllActions();
        magicNode.setPosition(pos1);
        
        if(content == "catch"){
            var ji = magic2.getChildByName("ji");
            ji.active = true;
            ji.setPosition(pos2);
        }
        magicNode.scaleX = 0;
        magicNode.scaleY = 0;
        magicNode.rotation = 0;
        magicNode.runAction(cc.sequence(cc.spawn(cc.scaleTo(1,1),cc.moveTo(1,pos2),cc.rotateBy(1,360)).easing(cc.easeElasticInOut(3.0)),cc.callFunc(function(){
            magic2.active = false;
            callback();
        })));
    },

    onQiangzhuangClicked:function(event,data){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        var number = 0;
        var value = parseInt(data);
        if(value > 0 && value <= 4){
            number = value;
        }
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.qiangzhuang,number);
        this.setCountDownDesc("请等待其他玩家抢庄");
        var qiangzhuang = event.target.parent;
        var anim = qiangzhuang.getComponentInChildren(cc.Animation);
        anim.stop();
        this.hideOptions();
        
    },
    onXiazhuClicked:function(event,data){
        var number = 1;
        var value = parseInt(data);
        if(value > 1 && value <= 5){
            number = value;
        }
        this.setCountDownDesc("请等待其他玩家下注");
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.xiazhu,number);
        var xiazhu = event.target.parent;
        var anim = xiazhu.getComponentInChildren(cc.Animation);
        anim.stop();
        this.hideOptions();
    },
    onLiangpaiClicked:function(event){
        var name = event.target.name;
        if(name == "liangpai"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.liangpai);
            this.hideCuopai();
            //var seats = this.nnGame.seats;
            //seats.kaipai(cc.vv.userMgr.userId);
        }
        else if(name == "cuopai"){
            this.showCuopai();
        }
        this.hideOptions();
    },
    isNiuniu:function(){
        var time = Date.now();
        if(this.lastTouchTime && time-this.lastTouchTime < 500){
            var self = this;
            cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.niuniu_resp,function(data){
                if(data.code == 0){
                    cc.vv.audioMgr.playSFX("btn3.mp3");
                    //cc.vv.prefabMgr.alertOpen(self.node,"提示","设置成功");
                }
                else if(data.code == 1){
                    //cc.vv.prefabMgr.alertOpen(self.node,"提示","次数不足");
                }
            });
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.niuniu);
        }
        this.lastTouchTime = time;
    },

    voiceMsg : function(data){
        this._voiceMsgQueue.push(data);
        this.playVoice();
    },
    playVoice:function(){
        if(this._voiceMsgQueue.length > 0){
            console.log("playVoice2");
            this._playingCount ++;
            var data = this._voiceMsgQueue.shift();
            var msgInfo = data.content;
            var msgfile = "voicemsg.amr";
            cc.vv.voiceMgr.writeVoice(msgfile,msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
            var self = this;
            setTimeout(function(){
                self._playingCount --;
                if(self._playingCount == 0){
                    cc.vv.audioMgr.resumeAll();
                }
            },msgInfo.time + 100);
        }
    },
    
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        this._interval += dt;
        if(this._interval >= 1){
            this._interval -= 1;
            var date = new Date();
            var h = date.getHours();
            h = h < 10? ("0"+h):h;
            
            var m = date.getMinutes();
            m = m < 10? ("0"+m):m;
            var s = date.getSeconds();
            var gap = " : ";
            if(s%2==0){
                gap = "   ";
            }
            this._time.string = "" + h + gap + m;

            if(this.countDown >= 0){
                this.countDown -= 1;
                if(this.countDown < 0){
                    this._countDownSecond.node.parent.active = false;
                }
                else{
                    this._countDownSecond.string = "" + this.countDown;
                }
            }
        }

    },

    onDestroy:function(){
        cc.vv.voiceMgr.stop();
        cc.eventManager.removeListener(this.backListener);
    }
});
