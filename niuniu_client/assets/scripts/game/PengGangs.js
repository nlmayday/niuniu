cc.Class({
    properties: {
        penggangroot : [],
        penggangPrefab:[],
    },

    init(mjGame,gameRoot,sides){
        this.mjGame = mjGame;
        this.sides = sides;
        for(var i = 0;i < sides.length;i++){
            var penggangs = gameRoot.getChildByName(sides[i]).getChildByName("penggangs");
            this.penggangroot.push(penggangs);
        }
        this.penggangPrefab.push(this.mjGame.penggangDown,this.mjGame.penggangRight,          this.mjGame.penggangUp,this.mjGame.penggangLeft);
    },
    
    onPengGangChanged:function(seatData){
        if(seatData.penggangs.length == 0){
            return;
        }
        var index = this.mjGame.getLocalIndex(seatData.userId);
        for(var i = 0; i < seatData.penggangs.length; ++i){
            var type = seatData.penggangs[i][0];
            var mjId = seatData.penggangs[i][1];
            this.initPengAndGangs(this.penggangroot[index],i,index,type,mjId);
        }  
    },
    
    initPengAndGangs:function(parent,index,side,type,mjId){
        var pgroot = null;
        if(parent.childrenCount <= index){
            pgroot = cc.instantiate(this.penggangPrefab[side]);
            parent.addChild(pgroot);    
        }
        else{
            pgroot = parent.children[index];
            pgroot.active = true;
        }
        
        if(side == 0){
            pgroot.y = 0;
            pgroot.x = index * 73 * 3 + index * 10;                    
        }
        else if(side == 1){
            pgroot.x = 0;
            pgroot.y = (index * 28 * 3);
            pgroot.setLocalZOrder(-index);
        }
        else if(side == 2){
            pgroot.y = 0;
            pgroot.x = -(index * 48 * 3) - index * 10;
        }
        else if(side == 3){
            pgroot.x = 0;
            pgroot.y = -(index * 28 * 3);                    
        }
        
        var sideArr = ["d","lr","u","lr"];
        var sprites = pgroot.children;
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s].getComponent(cc.Sprite);
            if(sprite.node.name == "gang"){
                var isGang = type != "peng" && type != "chi";
                sprite.node.active = isGang; 

                /*if(type == "angang" && side != 0){
                    sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,sideArr[side],"gang");
                    sprite.isGang = true;
                    sprite.node.getChildByName("mj").active = false;
                }
                else{*/
                    sprite.isGang = false;
                    sprite.node.getChildByName("mj").active = true;
                    cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite.node,mjId);
                //} 
            }
            else if(type == "angang"){
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,sideArr[side],"gang");
                sprite.isGang = true;
                sprite.node.getChildByName("mj").active = false;
            }
            else if(type == "chi"){
                sprite.isGang = false;
                sprite.node.getChildByName("mj").active = true;
                cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite.node,mjId.chi[s]);
            }
            else{ 
                sprite.isGang = false;
                sprite.node.getChildByName("mj").active = true;
                cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite.node,mjId);
            }
        }
    },
    hidePengAndGangs : function(){
        for(var i=0;i<this.penggangroot.length;i++){
            var children = this.penggangroot[i].children;
            for(var j=0;j<children.length;j++){
                children[j].active = false;
            }
        }
    },
    changeMJType : function(){
        var sideArr = ["d","lr","u","lr"];
        for(var i=0;i<this.penggangroot.length;i++){
            var children1 = this.penggangroot[i].children;
            for(var j=0;j<children1.length;j++){
                var children2 = children1[j].children;
                for(var s = 0; s < children2.length; ++s){
                    var sprite = children2[s].getComponent(cc.Sprite);
                    var type = sprite.isGang?"gang":"peng";
                    sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,sideArr[i],type);
                }
            }
        }
        for(var i=0;i<this.penggangPrefab.length;i++){
            var children1 = this.penggangPrefab[i].children;
            for(var s = 0; s < children1.length; ++s){
                var sprite = children1[s].getComponent(cc.Sprite);
                var type = "peng";
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,sideArr[i],type);
            }
        }
    },
});
