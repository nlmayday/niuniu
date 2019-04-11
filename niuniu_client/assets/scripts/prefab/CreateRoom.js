cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    // use this for initialization
    onLoad: function () {
        this._wanfa = [];
        var t = this.node.getChildByName("wanfa");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent(cc.Toggle);
            if(n != null){
                this._wanfa.push(n);
            }
        }
        this._jushu = [];
        t = this.node.getChildByName("jushu");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent(cc.Toggle);
            if(n != null){
                this._jushu.push(n);
            }
        }
        this._simi = [];
        t = this.node.getChildByName("simi");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent(cc.Toggle);
            if(n != null){
                this._simi.push(n);
            }
        }
        this._condition = [];
        t = this.node.getChildByName("condition");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent(cc.Toggle);
            if(n != null){
                this._condition.push(n);
            }
        }
        this._difen = [];
        t = this.node.getChildByName("difen");
        for(var i = 0; i < t.childrenCount; ++i){
            var n = t.children[i].getComponent(cc.Toggle);
            if(n != null){
                this._difen.push(n);
            }
        }
        
        this._condition[0].isChecked = true;
        this._difen[1].isChecked = true;
        this.difenArr = [5,10,20,30,50,100,200,300,500];
        //this.editBox = this.node.getChildByName("roomName").getComponent(cc.EditBox);
    },

    onToggle:function(event,data){
        var index = parseInt(data) - 1;
        var base = this.difenArr[index];
        var fen1 = this._condition[0].node.getChildByName("fen").getComponent(cc.Label);
        var fen2 = this._condition[1].node.getChildByName("fen").getComponent(cc.Label);
        fen1.string = "" + (base * 100);
        fen2.string = "" + (base * 200);
        this._condition[0].isChecked = true;
        this._condition[1].isChecked = false;
    },
    onBtnBack:function(){
        cc.vv.prefabMgr.layoutClose();
    },
    onBtnOK:function(){
        //cc.vv.prefabMgr.layoutClose2();
        this.createRoom();
    },
    
    createRoom:function(){
        var type = "wd_nn";

        var wanfa = 0;
        for(var i = 0; i < this._wanfa.length; ++i){
            if(this._wanfa[i].isChecked){
                wanfa = i+1;
                break;
            }     
        }
        var jushu = 0;
        for(var i = 0; i < this._jushu.length; ++i){
            if(this._jushu[i].isChecked){
                jushu = i+1;
                break;
            }     
        }
        var simi = 0;
        for(var i = 0; i < this._simi.length; ++i){
            if(this._simi[i].isChecked){
                simi = i+1;
                break;
            }     
        }
        var condition = 0;
        for(var i = 0; i < this._condition.length; ++i){
            if(this._condition[i].isChecked){
                condition = i+1;
                break;
            }     
        }
        var difen = 0;
        for(var i = 0; i < this._difen.length; ++i){
            if(this._difen[i].isChecked){
                difen = i+1;
                break;
            }     
        }

        //var roomName = cc.vv.utils.toBase64(this.editBox.string);
        var conf = {
            type:type,
            maxGames:jushu,
            roomNum:1,
            wanfa:wanfa,
            simi:simi,
            condition : condition,
            difen:difen,
            //roomName:roomName,
        }; 
        console.log("++++++++++++++",conf);

        var self = this;
        cc.vv.prefabMgr.waitOpen(self.node,"创建房间中");
        var onCreate = function(ret){
            if(ret.errcode){
                cc.vv.prefabMgr.waitClose();
                var content = "";
                if(ret.errcode == 407){
                    content = "游戏豆不足，创建房间失败";
                }
                console.log("createRoom errcode",ret.errcode);
                cc.vv.prefabMgr.alertOpen(self.node,"提示",content);
            }
            else{
                cc.vv.userMgr.enterRoom(ret.roomId,null);
            }
        };

        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.create_room_resp,onCreate);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.create_room,{conf:conf});  
    }

});
