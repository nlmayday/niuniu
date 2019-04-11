cc.Class({
    extends: cc.Component,

    properties: {
        //节点
        _notifyStr : "",
    },

    onLoad: function () {
        if(!cc.vv){
            cc.director.loadScene("Loading");
            return;
        }
        cc.vv.hall = this;
        
        this._notify = this.node.getChildByName("notify_bg").getChildByName("notify").getComponent(cc.Label);
        this._notify.string = this._notifyStr;
        this.bottom = this.node.getChildByName("bottom");
        this.xiala = this.node.getChildByName("xiala");
        this.button = this.node.getChildByName("button");
        this.button.active = false;
        this.initEventHandlers();
        
        cc.vv.audioMgr.playBGM("bgm0.mp3");
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.getNotify,cc.vv.entrance.title);
    },
    start : function(){
        var user = this.node.getChildByName("userInfo").getComponent("NNUser");
        user.setUserInfo(cc.vv.userMgr);
        user.refresh();

        var self = this;
        var enterRoom = function(id){
            cc.vv.prefabMgr.waitOpen(self.node,"进入房间中");
            cc.vv.userMgr.enterRoom(id,function(ret){
                if(ret.errcode){
                    cc.vv.prefabMgr.waitClose();
                    var content = "";
                    if(ret.errcode == 404){
                        content = "房间["+ roomId +"]不存在，请重新输入!";
                    }
                    else if(ret.errcode == 405){
                        content = "房间["+ roomId + "]已满!";
                    }
                    else if(ret.errcode == 407){
                        content = "游戏豆不足，进入房间失败";
                    }
                    cc.vv.prefabMgr.alertOpen(self.node,"提示",content);
                }
            });   
        }

        /*
        var roomId = cc.vv.anysdkMgr.getRoomId();
        cc.vv.anysdkMgr.setGetRoomIdHandle(enterRoom);
        if(cc.vv.userMgr.oldRoomId && cc.vv.userMgr.oldRoomId != "null"){
            enterRoom(cc.vv.userMgr.oldRoomId);
            cc.vv.userMgr.oldRoomId = null;
        }
        else if(roomId){
            enterRoom(roomId);
        }
        
        if(cc.vv.userMgr.oldRoomId2){
            //返回房间时
        }
        else{
            
        }
        */
       
        var self = this;
        this.backListener = cc.EventListener.create({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (keyCode, event) {
                cc.log('pressed key: ' + keyCode);
            },
            onKeyReleased: function (keyCode, event) {
                cc.log('released key: ' + keyCode);
                if(cc.sys.os == cc.sys.OS_ANDROID){ 
                    if(keyCode == cc.KEY.back||keyCode == cc.KEY.escape){
                        cc.vv.prefabMgr.alertOpen(self.node,"退出游戏","确认退出游戏？",function(){
                            cc.game.end();
                        },true)
                    }
                }
            }
        });
        cc.eventManager.addListener(this.backListener,100);
    },
    onDestroy:function(){
        cc.eventManager.removeListener(this.backListener);
        cc.vv.hall = null;
    },
    refreshNotify : function(){
        if(this._notify.node.x > 360 || this._notify.node.x + this._notify.node.width < -360){
            console.log(this._notifyStr);
            this._notify.string = this._notifyStr;
            this._notify.node.stopAllActions();
            this._notify.node.runAction(cc.repeatForever(cc.sequence(cc.place(cc.p(400,-2)),cc.moveBy((800 + this._notify.node.width)/80,cc.p(-800 - this._notify.node.width,0)),cc.delayTime(2))));
        }
        else{
            var self = this;
            setTimeout(function(){
                self.refreshNotify();
            },500);
        }
    },

    initEventHandlers:function(){
        //初始化事件监听器
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.getNotify_resp,function(data){
            console.log(data)
            var notify = cc.vv.utils.fromBase64(data);
            self._notifyStr = notify;
            self.refreshNotify();
        });
        var user = this.node.getChildByName("userInfo").getComponent("NNUser");
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.money_change,function(ret){
            if(ret.gems != null){
                cc.vv.userMgr.gems = ret.gems;
            }
            if(ret.coins != null){
                cc.vv.userMgr.coins = ret.coins;
            }
            if(ret.roomCard != null){
                cc.vv.userMgr.roomCard = ret.roomCard;
            }
            if(user.isValid){
                user.refreshMoney(ret);
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.union_change,function(ret){
            if(ret.unionId != null){
                cc.vv.userMgr.unionId = ret.unionId;
            }
        });
        
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.get_unionInfo_resp,function(ret){
            cc.vv.unionInfo = ret;
            cc.vv.unionInfo.name = cc.vv.utils.fromBase64(ret.name);
            if(ret.notify)cc.vv.unionInfo.notify = cc.vv.utils.fromBase64(ret.notify);
            //cc.vv.prefabMgr.waitClose();
            cc.vv.prefabMgr.unionOpen(self.node);
        });
    },
    onGameClick: function (event) {
        cc.vv.audioMgr.playSFX("btn3.mp3");
        var name = event.target.name;
        if(name == "quick"){
            cc.vv.prefabMgr.quickOpen(this.node);
        }
        else if(name == "wd_nn"){
            var self = this;
            if(cc.vv.userMgr.oldRoomId2){
                var enterRoom = function(id){
                    cc.vv.prefabMgr.waitOpen(self.node,"进入房间中");
                    cc.vv.userMgr.enterRoom(id,function(ret){
                        if(ret.errcode){
                            cc.vv.prefabMgr.waitClose();
                            var content = "";
                            if(ret.errcode == 404){
                                content = "房间["+ roomId +"]不存在，请重新输入!";
                            }
                            else if(ret.errcode == 405){
                                content = "房间["+ roomId + "]已满!";
                            }
                            else if(ret.errcode == 407){
                                content = "游戏豆不足，进入房间失败";
                            }
                            cc.vv.prefabMgr.alertOpen(self.node,"提示",content);
                        }
                    });   
                }
                enterRoom(cc.vv.userMgr.oldRoomId2);
                cc.vv.userMgr.oldRoomId2 = null;
                return;
            }
            cc.vv.hall.seleteGame = name;
            cc.vv.prefabMgr.createRoomOpen(this.node);
        }
        else if(name == "btn_join"){
            cc.vv.prefabMgr.joinRoomOpen(this.node);
        }
    },
    
    onBtnClick: function (event) {
        cc.vv.audioMgr.playSFX("btn3.mp3");
        var name = event.target.name;
        if(name == "btn_safeBox"){
            cc.vv.prefabMgr.safeBoxOpen(this.node);
        }
        else if(name == "btn_union"){
            if(cc.vv.userMgr.unionId){
                //cc.vv.prefabMgr.waitOpen(this.node,"获取信息中");
                cc.vv.netMgr.doSend1(cc.vv.netMgr.req.get_unionInfo,cc.vv.userMgr.unionId);
            }
            else{
                cc.vv.prefabMgr.unionCreateOpen(this.node);
            }
        }
        else if(name == "btn_kefu"){
            cc.vv.prefabMgr.kefuOpen(this.node);
        }
        else if(name == "share"){
            cc.vv.anysdkMgr.share(cc.vv.http.shareWeb,cc.vv.entrance.name,"玩起来超爽的牛牛游戏，大家都在玩，就等你了！",1);
        }
        else if(name == "more"){
           
            var more = this.node.getChildByName("more");
            if(this.xiala.active == true){
                this.moreOpened = false;
                this.xiala.stopAllActions();
                this.button.active = false;
            //   xiala.runAction(cc.moveTo(0.2,cc.p(430,266)));
                this.xiala.active = false;
            //    more.stopAllActions();
            //   more.runAction(cc.rotateTo(0.2,0));
            }
            else{
                this.moreOpened = true;
                this.xiala.stopAllActions();
                this.xiala.active = true;
              //  xiala.runAction(cc.moveTo(0.2,cc.p(300,266)));
                this.button.active = true;
              //  more.stopAllActions();
              //  more.runAction(cc.rotateTo(0.2,-90));
            }
        }
        else if(name == "button"){
            this.xiala.active = false;
            this.button.active = !this.button.active;

        }
        else if(name == "doudou"){
            cc.vv.prefabMgr.alertOpen(this.node,"提示","需要更多游戏豆，请向俱乐部申请");
        }
        else if(name == "huanqu"){
            cc.sys.localStorage.removeItem("lastLoginServer");
            cc.director.loadScene("Login");
            cc.vv.netMgr.close();
        }
        else if(name == "btn_setting"){
            cc.vv.prefabMgr.settingOpen(this.node);
        }
        else if(name == "statement"){
            cc.vv.prefabMgr.statementOpen(this.node);
        }
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
