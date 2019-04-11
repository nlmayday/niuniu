cc.Class({
    extends: cc.Component,

    properties: {
    },

    // use this for initialization
    start: function () {
        if(cc.vv === null){
            return;
        }
        var back = this.node.getChildByName("btn_back");
        var yy = this.node.getChildByName("yinyue");
        var yx = this.node.getChildByName("yinxiao");
        if(cc.vv.hall != null){
            back.active = true;
        }
        else{
            back.active = false;
            yy.y = 20;
            yx.y = -80;
        }
        var yinyue = this.node.getChildByName("yinyue").getChildByName("yinyue").getComponent(cc.Toggle);
        var yinxiao = this.node.getChildByName("yinxiao").getChildByName("yinxiao").getComponent(cc.Toggle);
        var yinyueValue = cc.sys.localStorage.getItem("yinyue") == 0?false:true;
        var yinxiaoValue = cc.sys.localStorage.getItem("yinxiao") == 0?false:true;
        yinyue.isChecked = yinyueValue;
        yinyue.node.getChildByName("Background").active = !yinyueValue;
        yinxiao.isChecked = yinxiaoValue;
        yinxiao.node.getChildByName("Background").active = !yinxiaoValue;
    },
    
    onBtnClicked:function(event){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        if(event.target.name == "btn_close"){
            cc.vv.prefabMgr.layoutClose();
        }
        else if(event.target.name == "btn_back"){
            cc.sys.localStorage.removeItem("account");
            cc.sys.localStorage.removeItem("sign");
            cc.vv.prefabMgr.layoutClose2();
            cc.director.loadScene("Login");
            cc.vv.netMgr.close();
        }
        /*else if(event.target.name == "btn_dissolve"){
            var isIdle = cc.vv.mjGame.numOfGames == 0;
            if(isIdle){
                cc.vv.prefabMgr.alertOpen(this.node,"解散房间","解散房间不扣钻石，是否确定解散？",function(){
                    if(cc.vv.mjGame.isOwner()){
                        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dispress);
                    }
                    else{
                        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.exit);  
                    }
                },true);
            }
            else{
                cc.vv.netMgr.doSend2(cc.vv.netMgr.req.dissolve_request);
            }
            cc.vv.prefabMgr.layoutClose2();
        }*/
        else if(event.target.parent.name == "yinyue"){
            var toggle = event.target.parent.getComponent(cc.Toggle);
            var isChecked = toggle.isChecked;
            event.target.active = !isChecked;
            cc.vv.audioMgr.setYinyue(isChecked);
            cc.sys.localStorage.setItem("yinyue",isChecked?1:0);
        }
        else if(event.target.parent.name == "yinxiao"){
            var toggle = event.target.parent.getComponent(cc.Toggle);
            var isChecked = toggle.isChecked;
            event.target.active = !isChecked;
            cc.vv.audioMgr.setYinxiao(isChecked);
            cc.sys.localStorage.setItem("yinxiao",isChecked?1:0);
        }
    }
});
