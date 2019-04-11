cc.Class({
    extends: cc.Component,

    properties: {
        loading : cc.Animation,
        label : cc.Label,
        _desc : "",
        _count : 0,
    },

    onLoad : function () {
        this.time = 0;
        this.totalTime = 0;
        this._count = 0;
        this.loading.play();
    },
    show : function (desc,callback) {
        this._desc = desc;
        this.label.string = this._desc;
        this.callback = callback;
    },
    
    update: function (dt) {
        this.time += dt;
        this.totalTime += dt;
        if(this.time > 1){
            this.time -= 1;
            
            this.label.string = this._desc;
            this._count += 1;
            this._count %= 4;
            for(var i = 0; i < this._count; ++ i){
                this.label.string += '.';
            }
            
        }
        if(this.totalTime > 5){
            cc.vv.prefabMgr.alertOpen(this.node.parent,"提示","连接超时，请稍后重试",this.callback);
            cc.vv.prefabMgr.waitClose();
        }
    },
});
