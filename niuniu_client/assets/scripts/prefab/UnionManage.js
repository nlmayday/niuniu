cc.Class({
    extends: cc.Component,

    properties: {
        award : cc.Prefab,
        awardList : cc.Prefab,
        doudou : cc.Prefab,
        join : cc.Prefab,
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
            var icon = unionInfo.getChildByName("icon").getComponent(cc.Sprite);
            cc.vv.userMgr.getUserBaseInfo(cc.vv.unionInfo.creator,function(ret){
               cc.vv.headImgLoader.load(ret.headImg,function(spriteFrame){
                icon.spriteFrame = spriteFrame;
            },cc.vv.userMgr.sex);
            },icon,name);

            var unionId = unionInfo.getChildByName("unionId").getComponent(cc.Label);
            unionId.string = "俱乐部ID:" + cc.vv.unionInfo.unionId;
            var notify = self.node.getChildByName("notify").getComponent(cc.Label);
            notify.string = cc.vv.unionInfo.notify?cc.vv.unionInfo.notify:"";

            self.number = self.node.getChildByName("number").getChildByName("count").getComponent(cc.Label);
            if(cc.vv.unionInfo.member == null){
                cc.vv.unionInfo.member = [];
            }
            var members = JSON.parse(cc.vv.unionInfo.member);
            self.number.string = "" + members.length;
            self.unionCoins = self.node.getChildByName("coins").getChildByName("coins").getComponent(cc.Label);
            self.unionCoins.string = "" + cc.vv.unionInfo.coins;
        }
        /*cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.get_unionInfo_resp,function(ret){
            cc.vv.unionInfo = ret;
            cc.vv.unionInfo.name = cc.vv.utils.fromBase64(ret.name);
            if(ret.notify)cc.vv.unionInfo.notify = cc.vv.utils.fromBase64(ret.notify);
            
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.get_unionInfo,cc.vv.userMgr.unionId);*/
        load();
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.unoin_coins_change,function(ret){
            cc.vv.unionInfo.coins = ret;
            if(self && self.node && self.node.isValid){
                self.unionCoins.string = "" + cc.vv.unionInfo.coins;
            }
        });
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.unoin_member_change,function(ret){
            cc.vv.unionInfo.member = ret;
            if(self && self.node && self.node.isValid){
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
                if(name == "award"){
                    this.awardOpen(children[i]);
                }
                else if(name == "awardList"){
                    this.awardListOpen(children[i]);
                }
                else if(name == "doudou"){
                    this.doudouOpen(children[i]);
                }
                else if(name == "join"){
                    this.joinOpen(children[i]);
                }
                else if(name == "record"){
                    this.recordOpen(children[i]);
                }
                return;
            }
        }
        var prefab = null;
        if(name == "award"){
            prefab = cc.instantiate(this.award);
            this.awardOpen(prefab);
        }
        else if(name == "awardList"){
            prefab = cc.instantiate(this.awardList);
            this.awardListOpen(prefab);
        }
        else if(name == "doudou"){
            prefab = cc.instantiate(this.doudou);
            this.doudouOpen(prefab);
        }
        else if(name == "join"){
            prefab = cc.instantiate(this.join);
            this.joinOpen(prefab);
        }
        else if(name == "record"){
            prefab = cc.instantiate(this.record);
            this.recordOpen(prefab);
        }
        else if(name == "manage"){
            prefab = cc.instantiate(this.manage);
            this.manageOpen(prefab);
        }
        
        if(prefab){
            prefab.customTag = name;
            var node = prefab.getChildByName("close_btn");
            cc.vv.utils.setClickEvent(node,this.node,"UnionManage","onBackClicked");
            this.node.addChild(prefab);
        }
    },
    awardOpen : function(node){
        this.awardNode = node;
        var get = node.getChildByName("get_btn");
        cc.vv.utils.setClickEvent(get,this.node,"UnionManage","award_req");
        var coins = node.getChildByName("coins").getComponent(cc.Label);
        coins.string = "" + "游戏豆";
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.award_count_resp,function(ret){
            coins.string = "" + ret + "游戏豆";
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.award_count,cc.vv.userMgr.unionId);
    },
    award_req : function(event){
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.award_coin_resp,function(ret){
            cc.vv.prefabMgr.alertOpen(self.node,"提示","成功领取" + ret + "游戏豆",function(){
                self.awardNode.active = false;
                cc.vv.unionInfo.coins += ret;
                self.unionCoins.string = "" + cc.vv.unionInfo.coins;
            });
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.award_coin,cc.vv.userMgr.unionId);
    },

    awardListOpen : function(node){
        this.awardListItem = node.getChildByName("scrollView").getChildByName("view").getChildByName("content").getChildByName("item");
        this.awardListItem.active = false;
        var self = this;
        var parent = self.awardListItem.parent;
        for(var i=1;i<parent.children.length;i++){
            var child = parent.children[i];
            child.active = false;
        }
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.award_coin_list_resp,function(ret){
            ret.sort(function(a,b){
                return b.time - a.time;
            });
            for(var i=0;i<ret.length;i++){
                var data = ret[i];
                var item;
                if(parent.children[i+1]){
                    item = parent.children[i+1];
                }
                else{
                    item = cc.instantiate(self.awardListItem);
                    parent.addChild(item);
                }
                item.active = true;
                console.log(data);
                var id = item.getChildByName("id").getComponent(cc.Label);
                var user = item.getChildByName("user");
                var name = user.getChildByName("name").getComponent(cc.Label);
                user.getChildByName("id").getComponent(cc.Label).string = "" + data.memberId;
                var icon = user.getChildByName("icon").getComponent(cc.Sprite);
                cc.vv.headImgLoader.load(cc.vv.userMgr.headImg,function(spriteFrame){
                    icon.spriteFrame = spriteFrame;
                },cc.vv.userMgr.sex);
                var coins = item.getChildByName("coins").getComponent(cc.Label);
                var time = item.getChildByName("time").getComponent(cc.Label);
                id.string = "" + (i+1);
                name.string = cc.vv.utils.cutString(cc.vv.utils.fromBase64(data.memberName),10);
                coins.string = "" + data.coins + "豆";
                time.string = cc.vv.utils.dateFormat("MM-dd hh:mm",data.time);
                item.customData = data;
            }
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.award_coin_list,cc.vv.userMgr.unionId);
    },

    doudouOpen : function(node){
        this.doudouItem = node.getChildByName("scrollView").getChildByName("view").getChildByName("content").getChildByName("item");
        var btn1 = this.doudouItem.getChildByName("btn1");
        var btn2 = this.doudouItem.getChildByName("btn2");
        cc.vv.utils.setClickEvent(btn1,this.node,"UnionManage","dealDoudou1");
        cc.vv.utils.setClickEvent(btn2,this.node,"UnionManage","dealDoudou2");
        this.doudouItem.active = false;
        var self = this;
        var parent = self.doudouItem.parent;
        for(var i=1;i<parent.children.length;i++){
            var child = parent.children[i];
            child.active = false;
        } 
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.apply_list_resp,function(ret){
            ret.sort(function(a,b){
                return b.time - a.time;
            });
            for(var i=0;i<ret.length;i++){
                var data = ret[i];
                var item;
                if(parent.children[i+1]){
                    item = parent.children[i+1];
                }
                else{
                    item = cc.instantiate(self.doudouItem);
                    parent.addChild(item);
                }
                item.active = true;
                var user = item.getChildByName("user");
                var id = user.getChildByName("id").getComponent(cc.Label);
                var name = user.getChildByName("name").getComponent(cc.Label);
                var icon = user.getChildByName("icon").getComponent(cc.Sprite);
                var coins = item.getChildByName("coins").getComponent(cc.Label);
                var time = item.getChildByName("time").getComponent(cc.Label);
                id.string = "" + data.memberId;
                name.string = cc.vv.utils.cutString(cc.vv.utils.fromBase64(data.memberName),10);
                cc.vv.headImgLoader.load(cc.vv.userMgr.headImg,function(spriteFrame){
                    icon.spriteFrame = spriteFrame;
                },cc.vv.userMgr.sex);
                coins.string = "" + data.coins;
                time.string = cc.vv.utils.dateFormat("MM-dd hh:mm",data.time);
                item.customData = data;
            } 
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.apply_list,cc.vv.userMgr.unionId);

        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.dealDoudou_resp,function(code){
            var  content = "";
            if(code == 0){
                return;
                //content = "同意申请成功";
            }
            else if(code == 1){
                content = "公会游戏豆不足，同意失败";
            }
            else if(code == 2){
                content = "拒绝成功";
            }
            cc.vv.prefabMgr.alertOpen(self.node,"提示",content);
        });
    },
    dealDoudou1  : function(event){
        var customData = event.target.parent.customData;
        cc.vv.prefabMgr.alertOpen(this.node,"提示","确认同意豆豆申请?",function(){
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.dealDoudou,{unionId:cc.vv.userMgr.unionId,id:customData.id,result:1});
        },true);
        event.target.parent.removeFromParent();
    },
    dealDoudou2  : function(event){
        var customData = event.target.parent.customData;
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.dealDoudou,{unionId:cc.vv.userMgr.unionId,id:customData.id,result:2});
        event.target.parent.removeFromParent();
    },
    joinOpen : function(node){
        this.joinItem = node.getChildByName("scrollView").getChildByName("view").getChildByName("content").getChildByName("item");
        var btn1 = this.joinItem.getChildByName("btn1");
        var btn2 = this.joinItem.getChildByName("btn2");
        cc.vv.utils.setClickEvent(btn1,this.node,"UnionManage","dealJoin1");
        cc.vv.utils.setClickEvent(btn2,this.node,"UnionManage","dealJoin2");
        this.joinItem.active = false;
        var self = this;
        var parent = self.joinItem.parent;
        for(var i=1;i<parent.children.length;i++){
            var child = parent.children[i];
            child.active = false;
        }  
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.join_list_resp,function(ret){
            ret.sort(function(a,b){
                return b.time - a.time;
            });
            for(var i=0;i<ret.length;i++){
                var data = ret[i];
                var item;
                if(parent.children[i+1]){
                    item = parent.children[i+1];
                }
                else{
                    item = cc.instantiate(self.joinItem);
                    parent.addChild(item);
                }
                item.active = true;
                var id = item.getChildByName("id").getComponent(cc.Label);
                var name = item.getChildByName("name").getComponent(cc.Label);
                var coins = item.getChildByName("coins").getComponent(cc.Label);
                var time = item.getChildByName("time").getComponent(cc.Label);
                
                id.string = "" + data.memberId;
                name.string = cc.vv.utils.cutString(cc.vv.utils.fromBase64(data.memberName),10);
                coins.string = "" + data.coins;
                time.string = cc.vv.utils.dateFormat("MM-dd hh:mm",data.time);
                item.customData = data;
            }
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.join_list,cc.vv.userMgr.unionId);

        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.dealJoin_resp,function(code){
            var  content = "";
            if(code == 0){
                content = "同意申请成功";
            }
            else if(code == 1){
                content = "对方已加入其他公会";
            }
            else if(code == 2){
                content = "拒绝成功";
            }
            cc.vv.prefabMgr.alertOpen(self.node,"提示",content);
        });
    },
    dealJoin1  : function(event){
        var customData = event.target.parent.customData;
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.dealJoin,{unionId:cc.vv.userMgr.unionId,id:customData.id,result:1});
        event.target.parent.removeFromParent();
    },
    dealJoin2  : function(event){
        var customData = event.target.parent.customData;
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.dealJoin,{unionId:cc.vv.userMgr.unionId,id:customData.id,result:2});
        event.target.parent.removeFromParent();
    },
    
    recordOpen : function(node){
        this.apply_record();
        var toggleGroup = node.getChildByName("toggleGroup");
        var toggle1 = toggleGroup.getChildByName("toggle1");
        var toggle2 = toggleGroup.getChildByName("toggle2");
        cc.vv.utils.addToggleEvent(toggle1,this.node,"UnionManage","apply_record");
        cc.vv.utils.addToggleEvent(toggle2,this.node,"UnionManage","offer_record");
        toggle1.getComponent(cc.Toggle).isChecked = true;
        toggle2.getComponent(cc.Toggle).isChecked = false;

        this.recordItem = node.getChildByName("scrollView").getChildByName("view").getChildByName("content").getChildByName("item");
        this.recordItem.active = false;
    },
    apply_record : function(){
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.apply_record_all_resp,function(ret){
            var parent = self.recordItem.parent;
            for(var i=1;i<parent.children.length;i++){
                var child = parent.children[i];
                child.active = false;
            }
            ret.sort(function(a,b){
                return b.time - a.time;
            });
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
                var user = item.getChildByName("user");
                var id = user.getChildByName("id").getComponent(cc.Label);
                var name = user.getChildByName("name").getComponent(cc.Label);
                var icon = user.getChildByName("icon").getComponent(cc.Sprite);
                var coins = item.getChildByName("coins").getComponent(cc.Label);
                var time = item.getChildByName("time").getComponent(cc.Label);
                id.string = "" + ret[i].memberId;
                name.string = cc.vv.utils.cutString(cc.vv.utils.fromBase64(ret[i].memberName),10);
                cc.vv.headImgLoader.load(cc.vv.userMgr.headImg,function(spriteFrame){
                    icon.spriteFrame = spriteFrame;
                },cc.vv.userMgr.sex);
                coins.string = ret[i].coins;
                time.string = cc.vv.utils.dateFormat("yyyy-MM-dd hh:mm",ret[i].time);
            }
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.apply_record_all,cc.vv.userMgr.unionId);
    },
    offer_record : function(){
        var self = this;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.offer_record_all_resp,function(ret){
            var parent = self.recordItem.parent;
            for(var i=1;i<parent.children.length;i++){
                var child = parent.children[i];
                child.active = false;
            }
            ret.sort(function(a,b){
                return b.time - a.time;
            });
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
                var user = item.getChildByName("user");
                var id = user.getChildByName("id").getComponent(cc.Label);
                var name = user.getChildByName("name").getComponent(cc.Label);
                var icon = user.getChildByName("icon").getComponent(cc.Sprite);
                var coins = item.getChildByName("coins").getComponent(cc.Label);
                var time = item.getChildByName("time").getComponent(cc.Label);
                id.string = "" + ret[i].memberId;
                name.string = cc.vv.utils.cutString(cc.vv.utils.fromBase64(ret[i].memberName),10);
                cc.vv.headImgLoader.load(cc.vv.userMgr.headImg,function(spriteFrame){
                    icon.spriteFrame = spriteFrame;
                },cc.vv.userMgr.sex);
                coins.string = ret[i].coins;
                time.string = cc.vv.utils.dateFormat("yyyy-MM-dd hh:mm",ret[i].time);
            }
        });
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.offer_record_all,cc.vv.userMgr.unionId);
    },

    manageOpen : function(node){
        this.userEditBox = node.getChildByName("editBox").getComponent(cc.EditBox);
        var sousuo = node.getChildByName("sousuo");
        cc.vv.utils.setClickEvent(sousuo,this.node,"UnionManage","sousuo");

        var front = node.getChildByName("front");
        var back = node.getChildByName("back");
        cc.vv.utils.setClickEvent(front,this.node,"UnionManage","frontPage");
        cc.vv.utils.setClickEvent(back,this.node,"UnionManage","backPage");

        var members = JSON.parse(cc.vv.unionInfo.member);
        var manager = JSON.parse(cc.vv.unionInfo.manager);
        this.yemaNum = 1;
        this.yema = node.getChildByName("yema").getComponent(cc.Label);
        this.yema.string = "" + this.yemaNum + "/" + Math.ceil(members.length/20);

        this.memberItem = node.getChildByName("scrollView").getChildByName("view").getChildByName("content").getChildByName("item");
        var icon = this.memberItem.getChildByName("icon");
        cc.vv.utils.setClickEvent(icon,this.node,"UnionManage","setManager");
        this.setting = node.getChildByName("scrollView").getChildByName("setting");
        var sure = this.setting.getChildByName("sure");
        cc.vv.utils.setClickEvent(sure,this.node,"UnionManage","set_sure");
        var close = this.setting.getChildByName("close");
        var self = this;
        close.on(cc.Node.EventType.TOUCH_START,function(){
            self.setting.active = false;
        },close);

        var parent = this.memberItem.parent;
        for(var j=0;j<parent.children.length;j++){
            var child = parent.children[j];
            child.active = false;
        }
        var loadsync = function(userId,sprite,name){
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,sprite);
                name.string = cc.vv.utils.cutString(ret.userName,10);
                id.string = "" + userId;
            },sprite,name);
        }
        for(var i=(this.yemaNum-1) * 20,k=0;i<this.yemaNum * 20;i++,k++){
            if(i >= members.length)break;
            var item;
            if(parent.children[k+1]){
                item = parent.children[k+1];
            }
            else{
                item = cc.instantiate(this.memberItem);
                parent.addChild(item);
            }
            var isManager = false;
            for(var j = 0;j<manager.length;j++){
                if(members[i] == manager[j]){
                    isManager = true;
                    break;
                }
            }
            item.active = true;
            item.userId = members[i];
            item.isManager = isManager;
            var sprite = item.getChildByName("icon").getComponent(cc.Sprite);
            var name = item.getChildByName("name").getComponent(cc.Label);
            var id = item.getChildByName("id").getComponent(cc.Label);
            loadsync(members[i],sprite,name,id);

            var manager2 = item.getChildByName("manager");
            manager2.active = isManager;
        }
    },
    setManager : function(event){
        if(cc.vv.unionInfo.creator != cc.vv.userMgr.userId)return;
        if(cc.vv.unionInfo.creator == event.target.parent.userId){
            return;
        }
        var item = event.target.parent;
        this.seleteUser = item;
        var pos = {};
        pos.x = item.getPosition().x + item.parent.getPosition().x + item.parent.parent.getPosition().x;
        pos.y = item.getPosition().y + item.parent.getPosition().y + item.parent.parent.getPosition().y;
        this.setting.active = true;
        this.setting.setPosition(pos);

        var toggle1 = this.setting.getChildByName("set1").getComponent(cc.Toggle);
        var toggle2 = this.setting.getChildByName("set2").getComponent(cc.Toggle);
        if(event.target.parent.isManager){
            toggle1.isChecked = true;
            toggle2.isChecked = false;
        }
        else{
            toggle1.isChecked = false;
            toggle2.isChecked = true;
        }
    },
    set_sure : function(){
        this.setting.active = false;
        var toggle1 = this.setting.getChildByName("set1").getComponent(cc.Toggle);
        var result = 2;
        if(toggle1.isChecked){
            result = 1;
        }
        if(this.seleteUser.isManager && result == 1){
            return;
        }
        if(this.seleteUser.isManager == false && result == 2){
            return;
        }
        var manager = this.seleteUser.getChildByName("manager");
        manager.active = result == 1;
        this.seleteUser.isManager =  result == 1;
        var userId = this.seleteUser.userId;
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.setManager,{unionId:cc.vv.userMgr.unionId,userId:userId,result:result});

        var manager2 = JSON.parse(cc.vv.unionInfo.manager);
        for(var j = 0;j<manager2.length;j++){
            if(this.seleteUser.userId == manager2[j]){
                manager2.splice(j,1);
                break;
            }
        }
        if(result == 1){
            manager2.push(this.seleteUser.userId);
        }
        cc.vv.unionInfo.manager = JSON.stringify(manager2);
    },
    set_close : function(event){
        this.setting.active = false;
    },
    sousuo : function(){
        var str = this.userEditBox.string;
        var userId = parseInt(str);
        if(userId > 0 || str == ""){
            var children = this.memberItem.parent.children;
            for(var i = 0;i<children.length;i++){
                var userId2 = children[i].userId;
                if(userId2 && (userId == userId2 || str == "")){
                    children[i].active = true;
                }
                else{
                    children[i].active = false;
                }
            }
        }
        else{
            cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的会员ID");
        }
    },
    frontPage : function(){
        if(this.yemaNum <= 1)return;
        this.yemaNum -= 1;
        var members = JSON.parse(cc.vv.unionInfo.member);
        var manager = JSON.parse(cc.vv.unionInfo.manager);
        this.yema.string = "" + this.yemaNum + "/" + Math.ceil(members.length/20);

        var parent = this.memberItem.parent;
        for(var j=0;j<parent.children.length;j++){
            var child = parent.children[j];
            child.active = false;
        }
        var loadsync = function(userId,sprite,name){
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,sprite);
                name.string = cc.vv.utils.cutString(ret.userName,10);
            },sprite,name);
        }
        for(var i=(this.yemaNum-1) * 20,k=0;i<this.yemaNum * 20;i++,k++){
            if(i >= members.length)break;
            var item;
            if(parent.children[k+1]){
                item = parent.children[k+1];
            }
            else{
                item = cc.instantiate(this.memberItem);
                parent.addChild(item);
            }
            var isManager = false;
            for(var j = 0;j<manager.length;j++){
                if(members[i] == manager[j]){
                    isManager = true;
                    break;
                }
            }
            item.active = true;
            item.userId = members[i];
            item.isManager = isManager;
            var sprite = item.getChildByName("icon").getComponent(cc.Sprite);
            var name = item.getChildByName("name").getComponent(cc.Label);
            loadsync(members[i],sprite,name);

            var manager2 = item.getChildByName("manager");
            manager2.active = isManager;
        }
    },
    backPage : function(){
        var members = JSON.parse(cc.vv.unionInfo.member);
        var manager = JSON.parse(cc.vv.unionInfo.manager);
        if(this.yemaNum >= Math.ceil(members.length/20))return;
        this.yemaNum += 1;
        this.yema.string = "" + this.yemaNum + "/" + Math.ceil(members.length/20);

        var parent = this.memberItem.parent;
        for(var j=0;j<parent.children.length;j++){
            var child = parent.children[j];
            child.active = false;
        }
        var loadsync = function(userId,sprite,name){
            cc.vv.userMgr.getUserBaseInfo(userId,function(ret){
                cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,sprite);
                name.string = cc.vv.utils.cutString(ret.userName,10);
            },sprite,name);
        }
        for(var i=(this.yemaNum-1) * 20,k=0;i<this.yemaNum * 20;i++,k++){
            if(i >= members.length)break;
            var item;
            if(parent.children[k+1]){
                item = parent.children[k+1];
            }
            else{
                item = cc.instantiate(this.memberItem);
                parent.addChild(item);
            }
            var isManager = false;
            for(var j = 0;j<manager.length;j++){
                if(members[i] == manager[j]){
                    isManager = true;
                    break;
                }
            }
            item.active = true;
            item.userId = members[i];
            item.isManager = isManager;
            var sprite = item.getChildByName("icon").getComponent(cc.Sprite);
            var name = item.getChildByName("name").getComponent(cc.Label);
            loadsync(members[i],sprite,name);

            var manager2 = item.getChildByName("manager");
            manager2.active = isManager;
        }
    },
    
    onBackClicked:function(event){
        var parent = event.target.parent;
        parent.active = false;
    },
    onCloseClicked:function(event){
        var parent = event.target.parent;
        parent.parent.getComponent("Union").onLoad();
        parent.removeFromParent();
    },
});
