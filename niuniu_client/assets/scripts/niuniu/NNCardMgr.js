var nnCardAll = [];

cc.Class({
    extends: cc.Component,

    properties: {
        
    },
    
    onLoad:function(){
        if(cc.vv == null){
            return;
        }
        cc.vv.nnCardMgr = this; 
        
        cc.loader.loadResDir("textures/niuniu/puker");
    },
    onDestroy:function(){
        cc.vv.nnCardMgr = null;
    },
    getMahjongSpriteByID:function(id){
        var value = id / 10;
        var type = id % 10;
        var name = "" + id;
        if(value == 11){
            id = "J" + type;
        }
        if(value == 11){
            id = "Q" + type;
        }
        if(value == 11){
            id = "K" + type;
        }
        var spriteFrameName = mahjongSprites[id];
        return this.allMj.getSpriteFrame("mj-" + spriteFrameName);
    },
    getMahjongType:function(id){
        if(id >= 0 && id < 9){
            return 0;
        }
        else if(id >= 9 && id < 18){
            return 1;
        }
        else if(id >= 18 && id < 27){
            return 2;
        }
        else if(id >= 27 && id < 34){
            return 3;
        }
        else if(id >= 34 && id < 42){
            return 4;
        }
    },
    setSpriteFrameByMJID:function(node,mjid){
        var spriteFrame = this.getMahjongSpriteByID(mjid);
        var mj = node.getChildByName("mj");
        if(mj){
            mj.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }
        else{
            cc.error("setSpriteFrameByMJID : mj is null");
        }
    },
    addSpriteFrameByMJID:function(node,type,mjid){
        var spriteFrame = this.getMahjongSpriteByID(mjid);
        var mj = node.getChildByName("mj");
        if(mj){
            mj.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }
        else{
            var mjNode = null;
            if(type == "show"){
                mjNode = cc.instantiate(this.showMJ);            
            }
            else if(type == "d_hand"){
                mjNode = cc.instantiate(this.d_handMJ);
            }
            else if(type == "d_peng"){
                mjNode = cc.instantiate(this.d_pengMJ);
            }
            else if(type == "d_fold"){
                mjNode = cc.instantiate(this.d_foldMJ);
            }
            else if(type == "l_peng"){
                mjNode = cc.instantiate(this.l_pengMJ);
            }
            else if(type == "r_peng"){
                mjNode = cc.instantiate(this.r_pengMJ);
            }
            else if(type == "u_peng"){
                mjNode = cc.instantiate(this.u_pengMJ);
            }
            if(mjNode){
                mjNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                node.addChild(mjNode);
            }
            else{
                cc.error("addSpriteFrameByMJID : type error");
            }
        }
    },
    
});
