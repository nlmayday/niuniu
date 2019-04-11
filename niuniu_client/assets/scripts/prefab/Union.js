cc.Class({
    extends: cc.Component,

    properties: {
        apply : cc.Prefab,
        offer : cc.Prefab,
        record : cc.Prefab,
        manage : cc.Prefab,
    },

    // use this for initialization
    onLoad : function () {
        var self = this;
        var load = function(){
            var unionInfo = self.node.getChildByName("unionInfo");
            var name = unionInfo.getChildByName("name").getComponent(cc.Label);
            name.string = "俱乐部:" + cc.vv.utils.cutString(cc.vv.unionInfo.name,11);
            self.icon = unionInfo.getChildByName("icon").getComponent(cc.Sprite);
           
            cc.vv.userMgr.getUserBaseInfo(cc.vv.unionInfo.creator,function(ret){
               cc.vv.headImgLoader.load(ret.headImg,function(spriteFrame){
                self.icon.spriteFrame = spriteFrame;
            },cc.vv.userMgr.sex);
            },self.icon,name);

            var unionId = unionInfo.getChildByName("unionId").getComponent(cc.Label);
            unionId.string = "俱乐部ID:" + cc.vv.unionInfo.unionId;
            var notify = unionInfo.getChildByName("notify").getComponent(cc.Label);
            notify.string = cc.vv.unionInfo.notify?cc.vv.unionInfo.notify:"";

            self.number = self.node.getChildByName("number").getChildByName("count").getComponent(cc.Label);
            if(cc.vv.unionInfo.member == null){
                cc.vv.unionInfo.member = [];
            }
            var members = JSON.parse(cc.vv.unionInfo.member);
            self.number.string = "" + members.length;
            self.unionCoins = self.node.getChildByName("coins").getChildByName("coins").getComponent(cc.Label);
            self.unionCoins.string = "" + cc.vv.unionInfo.coins;

            if(cc.vv.unionInfo.creator == cc.vv.userMgr.userId){
                unionInfo.getChildByName("exit").active = false;
            }

            var userInfo = self.node.getChildByName("userInfo");
            var name = userInfo.getChildByName("name").getComponent(cc.Label);
            name.string = cc.vv.utils.cutString(cc.vv.userMgr.userName,16);
            var icon = userInfo.getChildByName("icon").getComponent(cc.Sprite);
            cc.vv.headImgLoader.load(cc.vv.userMgr.headImg,function(spriteFrame){
                icon.spriteFrame = spriteFrame;
            },cc.vv.userMgr.sex);
            self.userCoins = userInfo.getChildByName("coins").getChildByName("coins").getComponent(cc.Label);
            self.userCoins.string = "" + cc.vv.userMgr.coins;

            var manageBtn = self.node.getChildByName("manage");
            var manager = JSON.parse(cc.vv.unionInfo.manager);
            var isManager = false;
            for(var i=0;i<manager.length;i++){
                if(cc.vv.userMgr.userId == manager[i]){
                    isManager = true;
                    break;
                }
            }
            if(!isManager){
                manageBtn.active = false;
            }
        }
        /*cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.get_unionInfo_resp,function(ret){
            cc.vv.unionInfo = ret;
            cc.vv.unionInfo.name = cc.vv.utils.fromBase64(ret.name);
            if(ret.notify)cc.vv.unionInfo.notify = cc.vv.utils.fromBase64(ret.notify);
            load();
            cc.vv.prefabMgr.waitClose();
        });
        cc.vv.prefabMgr.waitOpen(this.node.parent,"获取信息中",function(){
            cc.vv.prefabMgr.layoutClose();
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.get_unionInfo,cc.vv.userMgr.unionId);*/
        load();
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.unoin_coins_change,function(ret){
            cc.vv.unionInfo.coins = ret;
            if(self && self.node &&self.node.isValid){
                self.unionCoins.string = "" + cc.vv.unionInfo.coins;
                self.userCoins.string = "" + cc.vv.userMgr.coins;
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.unoin_member_change,function(ret){
            cc.vv.unionInfo.member = ret;
            if(self && self.node &&self.node.isValid){
                var members = JSON.parse(cc.vv.unionInfo.member);
                self.number.string = "" + members.length;
            }
        });
    },
    
    onBtnClicked : function (event) {
        var name = event.target.name;
        var children = this.node.children;
        for(var i=0;i<children.length;i++){
            if(children[i].customTag == name){
                children[i].active = true;
                if(name == "apply"){
                    this.applyOpen(children[i]);
                }
                else if(name == "offer"){
                    this.offerOpen(children[i]);
                }
                else if(name == "record"){
                    this.recordOpen(children[i]);
                }
                return;
            }
        }
        var prefab = null;
        if(name == "apply"){
            prefab = cc.instantiate(this.apply);
            this.applyOpen(prefab);
        }
        else if(name == "offer"){
            prefab = cc.instantiate(this.offer);
            this.offerOpen(prefab);
        }
        else if(name == "record"){
            prefab = cc.instantiate(this.record);
            this.recordOpen(prefab);
        }
        else if(name == "manage"){
            prefab = cc.instantiate(this.manage);
            prefab.customTag = name;
            this.node.addChild(prefab);
        }
        else if(name == "exit"){
            cc.vv.prefabMgr.alertOpen(this.node,"退出俱乐部","确定退出俱乐部！",function(){
                cc.vv.netMgr.doSend1(cc.vv.netMgr.req.exit_union,cc.vv.userMgr.unionId);
                cc.vv.userMgr.unionId = null;
                cc.vv.prefabMgr.layoutClose();
            },true)
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.exit_union,cc.vv.userMgr.unionId);
        }
        if(prefab && name != "manage"){
            prefab.customTag = name;
            var node = prefab.getChildByName("close_btn");
            cc.vv.utils.setClickEvent(node,this.node,"Union","onBackClicked");
            this.node.addChild(prefab);
        }
    },

    applyOpen : function(node){
        this.applyEditBox = node.getChildByName("editBox").getComponent(cc.EditBox);
        var apply = node.getChildByName("apply");
        cc.vv.utils.setClickEvent(apply,this.node,"Union","apply_req");
        var notify = node.getChildByName("notify").getComponent(cc.Label);
        notify.string = "您当前共有游戏豆: "+ cc.vv.userMgr.coins + "\n俱乐部共有游戏豆: " + cc.vv.unionInfo.coins;
    },
    apply_req : function(){
        var str = this.applyEditBox.string;
        var reg = new RegExp(/^[1-9]\d*$/);
        if(reg.test(str)){
            var count = parseInt(str);
            if(count > cc.vv.unionInfo.coins){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","申请游戏豆大于俱乐部总游戏豆数量，申请失败");
                console.log("申请游戏豆大于总游戏豆数量，申请失败");
                return;
            }
            cc.vv.prefabMgr.alertOpen(this.node,"提示","申请成功，等待审核",function(){
                cc.vv.prefabMgr.layoutClose2();
            })
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.apply_coin,{unionId:cc.vv.userMgr.unionId,coins:count});
        }
        else{
            cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的游戏豆数量");
            console.log("请输入正确的游戏豆数量");
            this.applyEditBox.string = "";
        }
    },

    offerOpen : function(node){
        this.offerEditBox = node.getChildByName("editBox").getComponent(cc.EditBox);
        var offer = node.getChildByName("offer");
        cc.vv.utils.setClickEvent(offer,this.node,"Union","offer_req");
        this.notify = node.getChildByName("notify").getComponent(cc.Label);
        this.notify.string = "您当前共有游戏豆: "+ cc.vv.userMgr.coins + "\n俱乐部共有游戏豆: " + cc.vv.unionInfo.coins;
    },
    offer_req : function(){
        var str = this.offerEditBox.string;
        var reg = new RegExp(/^[1-9]\d*$/);
        if(reg.test(str)){
            var count = parseInt(str);
            if(count > cc.vv.userMgr.coins){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","拥有游戏豆数量不足，贡献失败");
                console.log("拥有游戏豆数量不足，贡献失败");
                return;
            } 
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.offer_coin,{unionId:cc.vv.userMgr.unionId,coins:count});
            var coins1 = cc.vv.userMgr.coins - count;
            var coins2 = cc.vv.unionInfo.coins + count;
            this.notify.string = "您当前共有游戏豆: "+ coins1 + "\n俱乐部共有游戏豆: " + coins2;
            var self = this;
            cc.vv.prefabMgr.alertOpen(this.node,"提示","成功贡献" + count + "游戏豆",function(){
                cc.vv.prefabMgr.layoutClose2();
            });
        }
        else{
            cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的游戏豆数量");
            this.offerEditBox.string = "";
        }
    },

    recordOpen : function(node){
        this.apply_record();
        var toggleGroup = node.getChildByName("toggleGroup");
        var toggle1 = toggleGroup.getChildByName("toggle1");
        var toggle2 = toggleGroup.getChildByName("toggle2");
        cc.vv.utils.addToggleEvent(toggle1,this.node,"Union","apply_record");
        cc.vv.utils.addToggleEvent(toggle2,this.node,"Union","offer_record");
        toggle1.getComponent(cc.Toggle).isChecked = true;
        toggle2.getComponent(cc.Toggle).isChecked = false;

        this.recordItem = node.getChildByName("scrollView").getChildByName("view").getChildByName("content").getChildByName("item");
        this.recordItem.active = false;

    },
    apply_record : function(){
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.apply_record_resp,function(ret){
            ret.sort(function(a,b){
                return b.time - a.time;
            });
            var parent = self.recordItem.parent;
            for(var i=1;i<parent.children.length;i++){
                var child = parent.children[i];
                child.active = false;
            }
            for(var i=0;i<ret.length;i++){
                var item;
                if(parent.children[i+1]){
                    item = parent.children[i+1];
                }
                else{
                    item = cc.instantiate(self.recordItem);
                    parent.addChild(item);
                }
                item.active = true;
                item.getChildByName("coins").getComponent(cc.Label).string = ret[i].coins;
                item.getChildByName("time").getComponent(cc.Label).string = cc.vv.utils.dateFormat("yyyy-MM-dd hh:mm",ret[i].time);
            }
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.apply_record,cc.vv.userMgr.unionId);
    },
    offer_record : function(){
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.offer_record_resp,function(ret){
            ret.sort(function(a,b){
                return b.time - a.time;
            });
            var parent = self.recordItem.parent;
            for(var i=1;i<parent.children.length;i++){
                var child = parent.children[i];
                child.active = false;
            }
            for(var i=0;i<ret.length;i++){
                var item;
                if(parent.children[i+1]){
                    item = parent.children[i+1];
                }
                else{
                    item = cc.instantiate(self.recordItem);
                    parent.addChild(item);
                }
                item.active = true;
                item.getChildByName("coins").getComponent(cc.Label).string = ret[i].coins;
                item.getChildByName("time").getComponent(cc.Label).string = cc.vv.utils.dateFormat("yyyy-MM-dd hh:mm",ret[i].time);
            }
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.offer_record,cc.vv.userMgr.unionId);
    },


    onBackClicked:function(event){
        var parent = event.target.parent;
        parent.active = false;
    },
    onCloseClicked:function(event){
        cc.vv.prefabMgr.layoutClose();
    },
});
