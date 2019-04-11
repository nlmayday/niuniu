var mahjongSprites = [];

cc.Class({
    extends: cc.Component,

    properties: {
        mjType:{        //麻将样式
            default:[],
            type:cc.SpriteAtlas
        },
        allMj:{
            default:null,
            type:cc.SpriteAtlas
        },
    },
    
    onLoad:function(){
        if(cc.vv == null){
            return;
        }
        cc.vv.mahjongmgr = this; 
        //万
        for(var i = 1; i < 10; ++i){
            mahjongSprites.push("w_" + i);        
        }
        //筒
        for(var i = 1; i < 10; ++i){
            mahjongSprites.push("tong_" + i);
        }
        //条
        for(var i = 1; i < 10; ++i){
            mahjongSprites.push("tiao_" + i);
        }
        //东南西北风
        mahjongSprites.push("dong","nan","xi","bei");
        //中、发、白
        mahjongSprites.push("zhong","fa","bai");
        //春夏秋冬梅兰菊竹
        //mahjongSprites.push("chun","xia","qiu","dong2","mei","lan","ju","zhu");

        this.showMJ = this.node.getChildByName("show").getChildByName("mj");
        this.d_handMJ = this.node.getChildByName("d_hand").getChildByName("mj");
        this.d_pengMJ = this.node.getChildByName("d_peng").getChildByName("mj");
        this.d_foldMJ = this.node.getChildByName("d_fold").getChildByName("mj");
        this.l_pengMJ = this.node.getChildByName("l_peng").getChildByName("mj");
        this.r_pengMJ = this.node.getChildByName("r_peng").getChildByName("mj");
        this.u_pengMJ = this.node.getChildByName("u_peng").getChildByName("mj");
    },
    onDestroy:function(){
        cc.vv.mahjongmgr = null;
    },

    getMahjongSpriteByID:function(id){
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
    getMJBG:function(id,side,type){
        if((id>=1)==false)return;
        var atlas = this.mjType[id-1];
        if(side != "")side += "_";
        var name = "" + id + "-" + side + type;
        return atlas.getSpriteFrame(name);
    },
    getAudioURLByMJID:function(id){
        var realId = 0;
        if(id >= 0 && id < 9){
            realId = id + 21;
        }
        else if(id >= 9 && id < 18){
            realId = id - 8;
        }
        else if(id >= 18 && id < 27){
            realId = id - 7;
        }
        else if(id >= 27 && id < 34){
            realId = id + 4;
        }
        return "nv/" + realId + ".mp3";
    },
    
});
