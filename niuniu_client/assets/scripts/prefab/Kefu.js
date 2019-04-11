cc.Class({
    extends: cc.Component,

    properties: {
        kefuStr : cc.Label,
    },

    onLoad : function () {
        if(cc.vv.http.weChat && this.kefuStr)this.kefuStr.string = cc.vv.http.weChat;
    },
    
    onBtnClicked:function(event){
        if(event.target.name == "copy"){
            var text = this.kefuStr.string;
            cc.vv.anysdkMgr.copyText(text);
            cc.vv.prefabMgr.alertOpen(this.node.parent,"提示","已成功复制到剪切板！");
            cc.vv.prefabMgr.layoutClose2();
        }
    },

    onCloseClicked:function(event){
        cc.vv.prefabMgr.layoutClose();
    },
});
