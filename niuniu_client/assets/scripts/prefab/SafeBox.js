cc.Class({
    extends: cc.Component,

    properties: {
        coins : cc.Label,
        bank : cc.Label,
        editBox1 : cc.EditBox,
        editBox2 : cc.EditBox,
    },

    // use this for initialization
    onLoad: function () {
        this.coins.string = "携带: " + cc.vv.userMgr.coins;
        this.bank.string = "银行: " + cc.vv.userMgr.roomCard;
    },

    onSaveClick : function(){
        var str = this.editBox1.string;
        var reg = new RegExp(/^[1-9]\d*$/);
        if(reg.test(str)){
            var count = parseInt(str);
            if(count > cc.vv.userMgr.coins){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","拥有游戏豆数量不足，存入失败");
                console.log("拥有游戏豆数量不足，存入失败");
                return;
            } 
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.save_money,count);
            var coins1 = cc.vv.userMgr.coins - count;
            var coins2 = cc.vv.userMgr.roomCard + count;
            this.coins.string = "携带: " + coins1;
            this.bank.string = "银行: " + coins2;
            cc.vv.prefabMgr.alertOpen(this.node,"提示","成功存入" + count + "游戏豆",function(){
                cc.vv.prefabMgr.layoutClose();
            });
        }
        else{
            cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的游戏豆数量");
            this.editBox1.string = "";
        }
    },
    onTakeOutClick : function(){
        var str = this.editBox2.string;
        var reg = new RegExp(/^[1-9]\d*$/);
        if(reg.test(str)){
            var count = parseInt(str);
            if(count > cc.vv.userMgr.roomCard){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","银行游戏豆数量不足，取出失败");
                console.log("银行游戏豆数量不足，取出失败");
                return;
            } 
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.takeOut_money,count);
            var coins1 = cc.vv.userMgr.coins + count;
            var coins2 = cc.vv.userMgr.roomCard - count;
            this.coins.string = "携带: " + coins1;
            this.bank.string = "银行: " + coins2;
            cc.vv.prefabMgr.alertOpen(this.node,"提示","成功取出" + count + "游戏豆",function(){
                cc.vv.prefabMgr.layoutClose();
            });
        }
        else{
            cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的游戏豆数量");
            this.editBox2.string = "";
        }
    },
    onCloseClicked:function(event){
        cc.vv.prefabMgr.layoutClose();
    },
});
