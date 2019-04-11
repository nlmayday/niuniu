cc.Class({
    extends: cc.Component,

    properties: {
        _seatsPosition1 : [],
        _seatsPosition2 : [],
        _chupai : [],
        _playEfxs:[],
        _options : null,
        _theLastPai : null,
        _ting_Layout : null,
        _tingNode : null,
        _btn_ting : null,
        _chi_Layout:null,
        _interval : 0,
        
        _game_over: null,
        _game_result: null,
        _voiceMsgQueue:[],
        _playingCount:0,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        this.mjGame = this.node.getComponent("MJGame");
        this.initView();

        var self = this;
        this.backListener = cc.EventListener.create({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (keyCode, event) {
                cc.log('pressed key: ' + keyCode);
            },
            onKeyReleased: function (keyCode, event) {
                cc.log('released key: ' + keyCode);
                var isIdle = self.mjGame.numOfGames == 0;
                if((keyCode == cc.KEY.back||keyCode == cc.KEY.escape)&&isIdle){
                    self.onBtnBackClicked();
                }
            }
        });
        cc.eventManager.addListener(this.backListener,100);

        this._bg = this.node.getChildByName("bg").getComponent(cc.Sprite);
        this._bg2 = this.node.getChildByName("game_result").getChildByName("bg").getComponent(cc.Sprite);
        this.changeGameBg();
        this.changeMJType();
    },
    
    initView:function(){
        this.gameRoot = this.node.getChildByName("game");
        this.prepareRoot = this.node.getChildByName("prepare");
        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        
        this._game_over = this.node.getChildByName("game_over").getComponent("GameOver");
        this._game_result = this.node.getChildByName("game_result").getComponent("GameResult");
        this._game_over.onLoad();
        this._game_result.onLoad();
        this._game_over.node.active = false;
        this._game_result.node.active = false;

        var sides = ["down","right","up","left"];
        for(var i = 0; i < sides.length; ++i){
            var side = sides[i];
            
            var sideChild = this.gameRoot.getChildByName(side);
            this._chupai.push(sideChild.getChildByName("pai"));
            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
        }
        var opts = this.gameRoot.getChildByName("ops");
        this._options = opts;
        this._chi_Layout = this.gameRoot.getChildByName("Layout_chi");
        this.hideOptions();
        this.hideChupai();

        var seats1 = this.prepareRoot.getChildByName("seats");
        for(var i = 0; i < seats1.children.length; ++i){
            this._seatsPosition1.push(seats1.children[i].getPosition());
        }
        this.mjGame.seats.setPosition(this._seatsPosition1);

        var seats2 = this.gameRoot.getChildByName("seats");
        for(var i = 0; i < seats2.children.length; ++i){
            this._seatsPosition2.push(seats2.children[i].getPosition());
        }
        this._roomId = this.node.getChildByName("roomInfo").getChildByName("roomId").getComponent(cc.Label);
        if(this.mjGame.roomId){
            this.showRoomId();
        }
        this._numOfGames = this.node.getChildByName("roomInfo").getChildByName("numOfGame").getComponent(cc.Label);
        if(this.mjGame.maxNumOfGames){
            this.showGameNum();
        }
        this._time = this.node.getChildByName("roomInfo").getChildByName("time").getComponent(cc.Label);
        this._interval = 1;
        this._mjCount = this.gameRoot.getChildByName("mjcount").getComponent(cc.Label);
        this._theLastPai = this.gameRoot.getChildByName("Sprite_thelastmj");
        this._ting_Layout = this.gameRoot.getChildByName("Layout_ting");
        this._tingNode = (this._ting_Layout.children)[0];
        this._ting_Layout.active = false;
        this._tingNode.active = false;
        this._btn_ting = this.gameRoot.getChildByName("Button_ting");
        this._btn_ting.active = false;


        this._tianTing = this.gameRoot.getChildByName("tianTing");
        this._dingque = this.gameRoot.getChildByName("dingque");
        this._tianTing.active = false;
        this._dingque.active = false;
    },
    
    refreshBtns:function(){
        if(this.mjGame.numOfGames > 0){
            this.prepareRoot.active = false;
            return;
        }
        var btnExit = this.prepareRoot.getChildByName("btnExit");
        var btnDispress = this.prepareRoot.getChildByName("btnDissolve");
        
        btnExit.active = !this.mjGame.isOwner();
        btnDispress.active = this.mjGame.isOwner();
    },
    showRoomId:function(){
        this._roomId.string = "" + this.mjGame.roomId;
    },
    showWanfa:function(str){
        var label = this.node.getChildByName("wanfa").getComponent(cc.Label);
        label.string = str;
    },
    showMJCount:function(){
        this._mjCount.string = "剩余" + this.mjGame.numOfMJ + "张";
    },
    showGameNum:function(){
        this._numOfGames.string = "" + this.mjGame.numOfGames + "/" + this.mjGame.maxNumOfGames + "局";
    },
    onGameBeign:function(){
        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        this.mjGame.seats.posMove(this._seatsPosition2);
        this.huType = "";
    },
    hideOptions:function(){
        this._options.active = false;
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i]; 
            if(child.name == "op"){
                child.active = false;
                child.getChildByName("btnPeng").active = false;
                child.getChildByName("btnGang").active = false;
                child.getChildByName("btnHu").active = false;
            }
        }
        this._chi_Layout.active = false;
    },
    hideChupai:function(){
        for(var i = 0; i < this._chupai.length; ++i){
            this._chupai[i].active = false;
        }        
    },

    showChupai:function(data){
        var pai = data.pai; 
        if( pai >= 0 ){
            var localIndex = this.mjGame.getLocalIndex(data.userId);
            var sprite = this._chupai[localIndex];
            cc.vv.mahjongmgr.addSpriteFrameByMJID(sprite,"show",pai);
            sprite.active = true;
            
            this.hideTheLastPai();
        }
        this.playSFX("" + pai + ".mp3",data.userId);
    },

    hideTheLastPai:function(){
        this._theLastPai.stopAllActions();
        this._theLastPai.active = false;
    },

    addOption:function(btnName,pai){
        var showpai = pai;
        if(btnName == "btnChi"){
            showpai = pai[0].pai;
        }
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i]; 
            if(child.name == "op" && child.active == false){
                child.active = true;
                var sprite = child.getChildByName("opTarget");
                cc.vv.mahjongmgr.addSpriteFrameByMJID(sprite,"show",showpai);
                
                var btn = child.getChildByName(btnName); 
                btn.active = true;
                btn.pai = pai;
                return;
            }
        }
    },
    
    showAction:function(data){
        if(this._options.active){
            this.hideOptions();
        }
        
        if(data && (data.hu || data.gang || data.peng || data.chi)){
            this._options.active = true;
            if(data.hu){
                this.addOption("btnHu",data.pai);
            }
            if(data.peng){
                this.addOption("btnPeng",data.pai);
            }
            if(data.gang){
                for(var i = 0; i < data.gangpai.length;++i){
                    var gp = data.gangpai[i];
                    this.addOption("btnGang",gp);
                }
            }   
            if(data.chi){
                this.needLoadChi = true;
                this.addOption("btnChi",data.chipai);
            }   
        }
    },
    playSFX:function(name,userId){
        if(userId){
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.audioMgr.playSFX(name,"mj",ret.sex);
            });
        }
        else{
            cc.vv.audioMgr.playSFX(name,"mj");
        }
    },
    playEfx:function(userId,name){
        var index = this.mjGame.getLocalIndex(userId);
        this._playEfxs[index].play(name);
    },
    doChi : function(data){
        this.playSFX("chi" + ".mp3",data.userId);
        this.playEfx(data.userId,"chi");
    },
    doPeng : function(data){
        if(this.pengTime == null){
            this.pengTime = 0;
        }
        this.pengTime = this.pengTime % 3 + 1;
        this.playSFX("peng"+this.pengTime + ".mp3",data.userId);
        this.playEfx(data.userId,"peng");
    },
    doGang : function(data){
        if(this.gangTime == null){
            this.gangTime = 0;
        }
        this.gangTime = this.gangTime % 3 + 1;
        this.playSFX("gang"+this.gangTime + ".mp3",data.userId);
        this.playEfx(data.userId,"gang");
    },
    doHu : function(data){
        if(this.huTime == null){
            this.huTime = 0;
        }
        if(data.userId == cc.vv.userMgr.userId){
            this.hideOptions();
        }
        this.huType = data.type;
        if(data.type == "zimo"){
            this.huTime = this.huTime % 2 + 1;
            this.playSFX("zimo"+this.huTime + ".mp3",data.userId);
            this.playEfx(data.userId,"zimo");
        }
        else{
            this.huTime = this.huTime % 3 + 1;
            this.playSFX("hu"+this.huTime + ".mp3",data.userId);
            this.playEfx(data.userId,"hu");
        }

    },
    doOver : function(overData){
        var self = this;
        var isOver = this.mjGame.isOver;
        setTimeout(function(){
            if(overData){
                self._game_over.onGameOver(overData.results,self.mjGame);
            }
            if(isOver){
                self._game_result.onGameOver(overData.endInfo,self.mjGame);
            }
            self.mjGame.hands.hideAllMahjongs();
            self.mjGame.folds.hideAllFolds();
            self.mjGame.pengGangs.hidePengAndGangs();

            self.mjGame.que = -1;
            for(var i = 0; i <  self.mjGame.seatDatas.length; ++i){
                var userId = self.mjGame.seatDatas[i].userId;
                self.mjGame.seats.dingque(userId,-1);
                self.mjGame.seats.tianTing(userId,false);
            }

            self.hideChupai();
            self.hideOptions();
            self.hideTheLastPai();
            self.mjGame.pointer.initPointer();
            self._mjCount.string = "";
        },1000);
    },
    dingque : function(){
        this._dingque.active = true;
    },
    tianTing : function(){
        this._tianTing.active = true;
    },
    chongfengji : function(){
        cc.find("chongfengji").getComponent(cc.Animation).play("chongfengji");
    },
    showFanji : function(data){
        var fanji = cc.find("Canvas/game/fanji");
        if(fanji){
            fanji.active = true;
            cc.vv.mahjongmgr.addSpriteFrameByMJID(fanji,"show",data.fanji);
            fanji.runAction(cc.sequence(cc.fadeIn(0.2),cc.delayTime(0.8),cc.fadeOut(0.2)));
        }
        
    },
    showTing : function(data){
        var tingMap = data.tingMap;
        var pattern = data.pattern;
        if(tingMap && tingMap.length > 0){
            this.initTingHu(tingMap);
            this._btn_ting.active = true;
        }
        else{
            this.hideTingHu();
            this._btn_ting.active = false;
        }
    },
    leftCount: function(card){
        var count = 4;
        var seatDatas = this.mjGame.seatDatas;
        for(var i=0;i<seatDatas.length;i++){
            var seatData = seatDatas[i];
            if(seatData.holds){
                for(var j=0;j<seatData.holds.length;j++){
                    if(seatData.holds[j] == card){
                        count --;
                    }
                }
            }
            for(var j=0;j<seatData.folds.length;j++){
                if(seatData.folds[j] == card){
                    count --;
                }
            }
            for(var j=0;j<seatData.penggangs.length;j++){
                if(seatData.penggangs[j][0] == "peng"){
                    if(seatData.penggangs[j][1] == card){
                      count -= 3;  
                    }
                }
                else{
                    if(seatData.penggangs[j][1] == card){
                        count -= 4;  
                    }
                }
            }
        }
        return count;
    },
    initTingHu: function(tingList){
        console.log("initTingHu",tingList);
        if(tingList.length > 15){
            this._tingNode.active = true;
            return;
        }
        this._tingNode.active = false;
        
        while(this._ting_Layout.getChildByTag(1)){
            this._ting_Layout.getChildByTag(1).removeFromParent(true); 
        }
        for(var i=0;i<tingList.length;i++){
            if(i>=10)break;
            var tingData = tingList[i];
            var tingNode = cc.instantiate(this._tingNode);
            tingNode.active = true;
            var remainder = tingNode.getChildByName("Label_remainder").getComponent(cc.Label);
            var sprite = tingNode.getChildByName("Sprite_ting");
            remainder.string = this.leftCount(tingData);
            sprite.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,"d","hand");
            cc.vv.mahjongmgr.addSpriteFrameByMJID(sprite,"d_hand",tingData);
            this._ting_Layout.addChild(tingNode,1,1);
        }

    },
    hideTingHu:function(){
        while(this._ting_Layout.getChildByTag(1)){
            this._ting_Layout.getChildByTag(1).removeFromParent(true); 
        }
        this._ting_Layout.active = false;
    },
    
    showTingHu: function(){
        this._ting_Layout.active = !this._ting_Layout.active;
    },
    changeGameBg: function(){
        var self = this;
        var filepath = "textures/game/image/" + cc.vv.gameBg;
        cc.loader.loadRes(filepath, function(err, tex){
            if( err ){
                console.error(err);
                return;
            }
            var spriteFrame = new cc.SpriteFrame(tex,cc.Rect(0, 0, 1280, 720));
            if( spriteFrame ){
                self._bg.spriteFrame = spriteFrame;
                self._bg2.spriteFrame = spriteFrame;
            }
        });
    },
    changeMJType : function(){
        //展示牌
        for(var i = 0; i < this._chupai.length; ++i){
            var sprite = this._chupai[i].getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,"","show");
        } 
        //碰杠胡按钮上的牌
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i]; 
            if(child.name == "op"){
                var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,"","show");
            }
        }
        //吃选择面板
        var children = this._chi_Layout.children;
        for(var i=0;i < children.length;i++){
            var sprites = children[i].children;
            for(var s = 0; s < sprites.length; ++s){
                var sprite = sprites[s].getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,"d","hand");
            }
        }
        //碰杠预设节点
        var penggangPrefab = [this.mjGame.penggangDown,this.mjGame.penggangRight,this.mjGame.penggangUp,this.mjGame.penggangLeft];
        var sideArr = ["d","lr","u","lr"];
        for(var i=0;i<penggangPrefab.length;i++){
            var children1 = penggangPrefab[i].children;
            for(var s = 0; s < children1.length; ++s){
                var sprite = children1[s].getComponent(cc.Sprite);
                var type = "peng";
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,sideArr[i],type);
            }
        }
        //小结算里面的牌
        this._game_over.changeMJType();

        this.mjGame.hands.changeMJType();
        this.mjGame.folds.changeMJType();
        this.mjGame.pengGangs.changeMJType();
    },
    seleteChi : function(chipai){
        if(chipai.length == 1){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.chi,chipai[0].index);
        }
        else if(chipai.length > 1){
            this._chi_Layout.active = !this._chi_Layout.active;
            if(this.needLoadChi){
                this.needLoadChi = false;
                var children = this._chi_Layout.children;
                for(var i=0;i < children.length;i++){
                    if(i>=chipai.length){
                        children[i].active = false;
                        continue;
                    }
                    children[i].active = true;
                    children[i].chiIndex = chipai[i].index;
                    var chi = [].concat(chipai[i].chi);
                    var idx = chi.indexOf(chipai[i].pai);
                    chi.splice(idx,1);
                    var sprites = children[i].children;
                    for(var s = 0; s < sprites.length; ++s){
                        var sprite = sprites[s].getComponent(cc.Sprite);
                        cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite.node,chi[s]);
                    }
                }
            }
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
    onBtnBackClicked:function(){
        cc.vv.prefabMgr.alertOpen(this.node,"返回大厅","返回大厅房间仍会保留，快去邀请大伙来玩吧！",function(){
            cc.vv.userMgr.oldRoomId2 = this.mjGame.roomId;
            cc.vv.netMgr.wsUri = cc.vv.netMgr.hallUrl;
            cc.vv.netMgr.initLink(function(){
                cc.director.loadScene("Hall");
            });
        },true)
    },
    
    onBtnChatClicked:function(){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        this.node.getChildByName("chat").active = true;
    },
    onOptionClicked:function(event){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        if(event.target.name == "btnChi"){
            this.seleteChi(event.target.pai);
        }
        else if(event.target.name == "Node_chi"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.chi,event.target.chiIndex);
        }
        else if(event.target.name == "btnPeng"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.peng);
        }
        else if(event.target.name == "btnGang"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.gang,event.target.pai);
        }
        else if(event.target.name == "btnHu"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.hu);
        }
        else if(event.target.name == "btnGuo"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.guo);
            this.hideOptions();
            this._tianTing.active = false;
        }
        else if(event.target.name == "btnTianTing"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.tianTing);
            this.mjGame.hands.tianTing();
            this._tianTing.active = false;
        }
        else if(event.target.name == "btnWan"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dingque,0);
            this._dingque.active = false;
        }
        else if(event.target.name == "btnTong"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dingque,1);
            this._dingque.active = false;
        }
        else if(event.target.name == "btnTiao"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dingque,2);
            this._dingque.active = false;
        }
    },
    onBtnWeichatClicked:function(){
        
    },
    
    onBtnDissolveClicked:function(){
        cc.vv.prefabMgr.alertOpen(this.node,"解散房间","解散房间不扣钻石，是否确定解散？",function(){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dispress);
        },true);
    },
    
    onBtnExit:function(){
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.exit);
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
        }
    },

    onDestroy:function(){
        cc.vv.voiceMgr.stop();
        cc.eventManager.removeListener(this.backListener);
    }
});
