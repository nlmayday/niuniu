cc.Class({
    extends: cc.Component,

    properties: {
        nums:{
            default:[],
            type:[cc.Label]
        },
        _inputIndex:0,
        bgs:{
            default:[],
            type:[cc.Sprite]
        },
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function () {
       
    },
    onEnable:function(){
        this.onResetClicked();
    },
    
    onInputFinished:function(roomId){
        cc.vv.prefabMgr.waitOpen(this.node,"进入房间中");
        cc.vv.userMgr.enterRoom(roomId,function(ret){
            if(ret.errcode == null){
               // this.onCloseClicked();
            }
            else{
                cc.vv.prefabMgr.waitClose();
                var content = "";
                if(ret.errcode == 404){
                    content = "房间["+ roomId +"]不存在，请重新输入!";
                }
                else if(ret.errcode == 405){
                    content = "房间["+ roomId + "]已满!";
                }
                else if(ret.errcode == 407){
                    content = "游戏豆不足，进入房间失败";
                }
                cc.vv.prefabMgr.alertOpen(this.node,"提示",content);
                //this.onResetClicked();
            }
        }.bind(this)); 
    },
    
    onInput:function(num){
        if(this._inputIndex >= this.nums.length){
            return;
        }
        this.bgs[this._inputIndex].node.active = false;
        this.nums[this._inputIndex].string = num;
        this._inputIndex += 1;
        
        if(this._inputIndex == this.nums.length){
            var roomId = this.parseRoomID();
            console.log("ok:" + roomId);
            this.onInputFinished(roomId);
        }
    },
    
    onNumberClicked:function(event,data){
        var number = parseInt(data);
        this.onInput(number);  
    },
    
    onResetClicked:function(){
        for(var i = 0; i < this.nums.length; ++i){
            this.nums[i].string = "";
            this.bgs[i].node.active = true;
        }
        this._inputIndex = 0;
    },
    onDelClicked:function(){
        if(this._inputIndex > 0){
            this._inputIndex -= 1;
            this.nums[this._inputIndex].string = "";
            this.bgs[this._inputIndex].node.active = true;
        }
    },
    onCloseClicked:function(){
        cc.vv.prefabMgr.layoutClose();
        
    },
    
    parseRoomID:function(){
        var str = "";
        for(var i = 0; i < this.nums.length; ++i){
            str += this.nums[i].string;
        }
        return str;
    }
});
