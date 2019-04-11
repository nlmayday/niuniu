cc.Class({
    extends: cc.Component,

    properties: {
        _delayTime:0,
        _extraInfo:null,
        _noticeLabel:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._noticeLabel = this.node.getChildByName("info").getComponent(cc.Label);
        this._mjGame = this.node.parent.getComponent("MJGame");
    },
    
    onBtnClicked:function(event){
        var btnName = event.target.name;
        if(btnName == "btn_agree"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dissolve_agree);
        }
        else if(btnName == "btn_reject"){
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dissolve_reject);
        }
    },
    
    
    showDissolveNotice:function(data){
        this.node.active = true;
        this._delayTime = data.delayTime;
        this._passTime = 0;
        this._extraInfo = "";
        for(var i = 0; i < data.states.length; ++i){
            var b = data.states[i];
            var name = this._mjGame.seatDatas[i].userName;
            if(b){
                this._extraInfo += "\n[已同意] "+ name;
            }
            else{
                this._extraInfo += "\n[待确认] "+ name;
            }
        }
    },
    
    hideDissolveNotice:function(data){
        this.node.active = false;
        this._passTime = -1;
    },
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._passTime >= 0){
            this._passTime += dt;
            if(this._passTime >= 1){
                this._passTime -= 1;
                this._delayTime -= 1;
                if(this._delayTime <= 0){
                    this._passTime = -1;
                }
            }
            
            var m = Math.floor(this._delayTime / 60);
            var s = Math.round(this._delayTime - m*60);
            
            var str = "";
            if(m > 0){
                str += m + "分"; 
            }
            
            this._noticeLabel.string = str + s + "秒后房间将自动解散" + this._extraInfo;
        }
    },
});
