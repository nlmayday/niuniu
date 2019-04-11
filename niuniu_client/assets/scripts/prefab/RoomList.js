cc.Class({
    extends: cc.Component,

    properties: {
        editBox : cc.EditBox,
        item : cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        var self = this;
        self.node.getComponent(cc.Animation).play("roomListShow");
        this.item.active = false;
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.getRoomsList_resp,function(ret){
            for(var i = 0;i<ret.length;i++){
                var data = ret[i];
                var item = cc.instantiate(self.item);
                item.active = true;
                var roomId = item.getChildByName("roomId").getComponent(cc.Label);
                //var style = item.getChildByName("style").getComponent(cc.Label);
                var difen = item.getChildByName("difen").getComponent(cc.Label);
                var gameofnum = item.getChildByName("gameofnum").getComponent(cc.Label);
                var condition = item.getChildByName("condition").getComponent(cc.Label);
                roomId.string =  data.roomId;
                //style.string = "看牌抢庄";
                difen.string =  data.difen;
                if(data.maxGames == -1){
                    gameofnum.string = "不夜场";
                }else{
                    gameofnum.string = data.maxGames;
                }
                condition.string =  data.condition;
                for(var j=1;j<=6;j++){
                    var mark = item.getChildByName("toggle" + j).getChildByName("checkmark");
                    if(j > data.numOfPlayers){
                        mark.active = false;
                    }
                    else{
                        mark.active = true;
                    }                 
                }
                item.roomData = data;
                cc.vv.utils.setClickEvent(item,self.node,"RoomList","onGameClick");
                self.item.parent.addChild(item,data.difen);
            }
            self.node.getChildByName("loading").active = false;
            self.node.getComponent(cc.Animation).play("loadEnd");
        });
        

        setTimeout(function(){
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.getRoomsList);
            cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.roomsList_refresh,function(ret){
                var data = ret;
                if(ret.new){
                    var item = cc.instantiate(self.item);
                    item.active = true;
                    var roomId = item.getChildByName("roomId").getComponent(cc.Label);
                    //var style = item.getChildByName("style").getComponent(cc.Label);
                    var difen = item.getChildByName("difen").getComponent(cc.Label);
                    var gameofnum = item.getChildByName("gameofnum").getComponent(cc.Label);
                    var condition = item.getChildByName("condition").getComponent(cc.Label);
                    roomId.string = data.roomId;
                    //style.string = "看牌抢庄";
                    difen.string = data.difen;
                    if(data.maxGames == -1){
                        gameofnum.string = "不夜场";
                    }else{
                        gameofnum.string =  data.maxGames;
                    }
                    
                    condition.string = data.condition;
                    for(var j=1;j<=6;j++){
                        var mark = item.getChildByName("toggle" + j).getChildByName("checkmark");
                        mark.active = false;              
                    }
                    item.roomData = data;
                    cc.vv.utils.setClickEvent(item,self.node,"RoomList","onGameClick");
                    self.item.parent.addChild(item,data.difen);
                    return;
                }
                
                if(ret.state == "delete"){
                    var children = self.item.parent.children;
                    for(var i = 0;i<children.length;i++){
                        var roomData = children[i].roomData;
                        if(roomData && roomData.roomId == ret.roomId){
                            children[i].removeFromParent();
                        }
                    }
                }
                else if(ret.state == "playing"){
                    //
                }
                else{
                    var children = self.item.parent.children;
                    for(var i = 0;i<children.length;i++){
                        var roomData = children[i].roomData;
                        if(roomData && roomData.roomId == ret.roomId){
                            for(var j=1;j<=6;j++){
                                var mark = children[i].getChildByName("toggle" + j).getChildByName("checkmark");
                                if(j > data.numOfPlayers){
                                    mark.active = false;
                                }
                                else{
                                    mark.active = true;
                                }                 
                            }
                        }
                    }
                }
            });
        }, 300);
        
    },
    onGameClick : function(event){
        var target = event.target;
        var data = target.roomData;

        if(cc.vv.userMgr.coins < data.condition){
            cc.vv.prefabMgr.alertOpen(this.node,"提示","游戏豆不足，进入房间失败");
            return;
        }
        if(data.numOfPlayers >= 6){
            cc.vv.prefabMgr.alertOpen(this.node,"提示","房间["+ data.roomId + "]已满!");
            return;
        }
        
        cc.vv.prefabMgr.waitOpen(this.node,"进入房间中");   
        cc.vv.userMgr.enterRoom(data.roomId,function(){
            cc.vv.netMgr.deleteHandler(cc.vv.netMgr.resp.roomsList_refresh);
        });
    },
    onEditBox : function(){
        console.log(11111111111111)
        var str = this.editBox.string;
        var reg = new RegExp(/\d*$/);
        if(reg.test(str)){
            var children = this.item.parent.children;
            for(var i = 0;i<children.length;i++){
                var roomData = children[i].roomData;
                if(roomData && (roomData.roomId == str || str == "")){
                    children[i].active = true;
                }
                else{
                    children[i].active = false;
                }
            }
        }
        else{
            cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的房间号");
            console.log("请输入正确的房间号");
        }
    },
    onCloseClick : function(event){
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.leave_roomList);
        cc.vv.netMgr.deleteHandler(cc.vv.netMgr.resp.roomsList_refresh);
        var anim = this.node.getComponent(cc.Animation);
        anim.play("roomListClose");
        anim.on("finished",function(){
            cc.vv.prefabMgr.layoutClose2();
        });
       
    },
    
});
