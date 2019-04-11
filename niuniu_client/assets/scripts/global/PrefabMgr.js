cc.Class({
    extends: cc.Component,

    properties: {
        _wait : null,        //当前的等待界面  7
        _alert : null,      //当前的通知界面  6
        _layout : null,      //当前的弹出层界面 5
        
        wait : cc.Prefab,
        alert : cc.Prefab,

        quick : cc.Prefab,
        createRoom : cc.Prefab,
        joinRoom : cc.Prefab,
        setting : cc.Prefab,
        union : cc.Prefab,
        unionCreate : cc.Prefab,
        safeBox : cc.Prefab,
        kefu : cc.Prefab,
        statement : cc.Prefab,
    },

    // use this for initialization
    onLoad: function () {
        if(!cc.vv){
            return;
        }
        this._wait = null;
        this._alert = null;
        this._layout = null;
        
        cc.vv.prefabMgr = this;
        cc.vv.eventManager = this.node.getComponent("EventManager");
        cc.game.addPersistRootNode(this.node);
    },
    
    quickOpen : function (parent) {
        this.layoutOpen2(parent,this.quick);
    },
    createRoomOpen : function (parent) {
        this.layoutOpen(parent,this.createRoom);
    },
    joinRoomOpen : function (parent) {
        this.layoutOpen(parent,this.joinRoom);
    },
    settingOpen : function (parent) {
        this.layoutOpen(parent,this.setting);
    },
    unionOpen : function (parent) {
        this.layoutOpen(parent,this.union);
    },
    unionCreateOpen : function (parent) {
        this.layoutOpen(parent,this.unionCreate);
    },
    safeBoxOpen : function (parent) {
        this.layoutOpen(parent,this.safeBox);
    },
    kefuOpen : function (parent) {
        this.layoutOpen(parent,this.kefu);
    },
    statementOpen : function (parent) {
        this.layoutOpen(parent,this.statement);
    },

    IsValid : function(){
        if(this._wait && this._wait.isValid == false){
            this._wait = null;  
        }
        if(this._alert && this._alert.isValid == false){
            this._alert = null;  
        }
        if(this._layout && this._layout.isValid == false){
            this._layout = null;  
        }
    },
    waitOpen : function (parent,title,callback) {
        this.IsValid();
        if(this._wait != null){
            return;
        };
        var wait = cc.instantiate(this.wait);
        parent.addChild(wait,7);
        wait.getComponent("Waiting").show(title,callback);
        this._wait = wait;
    },
    alertOpen : function (parent,title,content,onok,needcancel) {
        this.IsValid();
        if(this._alert != null){
            console.log(this._alert);
            return;
        };
        var alert = cc.instantiate(this.alert);
        parent.addChild(alert,6);
        alert.getComponent("Alert").show(title,content,onok,needcancel);
        this._alert = alert;
    },
    layoutOpen : function (parent,prefab) {
        this.IsValid();
        if(this._wait != null || this._alert != null || this._layout != null){
            console.log(this._wait,this._alert,this._layout);
            return;
        };
        var layout = cc.instantiate(prefab);
        parent.addChild(layout,5);
        this._layout = layout;
        this._layout.scale = 0.01;
        this._layout.runAction(cc.scaleTo(0.3, 1).easing(cc.easeBackOut(3.0)));
    },
    layoutOpen2 : function (parent,prefab) {
        this.IsValid();
        if(this._wait != null || this._alert != null || this._layout != null){
            console.log(this._wait,this._alert,this._layout);
            return;
        };
        var layout = cc.instantiate(prefab);
        parent.addChild(layout,5);
        this._layout = layout;
    },
    waitClose : function () {
        if(this._wait){
            try {
                this._wait.removeFromParent(true);
            } catch (error) {
                console.log(error);
            }
            this._wait = null;
        }
    },
    alertClose : function () {
        if(this._alert){
            this._alert.removeFromParent(true);
            this._alert = null;
        }
    },
    layoutClose : function () {
        var self = this;
        cc.vv.audioMgr.playSFX("btn3.mp3");
        var layout = this._layout;
        this._layout = null;
        layout.runAction(cc.sequence(cc.scaleTo(0.3, 0).easing(cc.easeQuarticActionOut(3.0)),cc.callFunc(function(){
            setTimeout(function(){
                layout.removeFromParent();
            },10);
        })));
    },
    layoutClose2 : function () {
        cc.vv.audioMgr.playSFX("btn3.mp3");
        if(this._layout){
            this._layout.removeFromParent();
            this._layout = null;
        }
    }
});
