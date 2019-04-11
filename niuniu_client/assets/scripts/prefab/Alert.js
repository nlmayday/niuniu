cc.Class({
    extends: cc.Component,

    properties: {
        label : cc.Label,
        btn_ok : cc.Node,
        btn_cancel : cc.Node,
    },

    onLoad : function () {
        this.time = 0;
        this._count = 0;
    },
    show : function (title,content,onok,needcancel) {
        this.label.string = content;
        this._onok = onok;
        if(!needcancel){
            this.btn_ok.x = 0;
            this.btn_cancel.active = false;
        }
    },
    
    onBtnClicked:function(event){
        if(event.target.name == "btn_ok"){
            if(this._onok){
                this._onok();
            }
        }
        cc.vv.prefabMgr.alertClose();
    },
});
