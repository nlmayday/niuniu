cc.Class({
    properties: {
        allCards : [],
    },

    init(mjGame,gameRoot,sides){
        this.mjGame = mjGame;
        this._theLastPai = gameRoot.getChildByName("Sprite_thelastmj");

        for(var i = 0;i < sides.length;i++){
            var folds = gameRoot.getChildByName(sides[i]).getChildByName("folds");
            var children = folds.children;
            var folds1 = [];
            for(var j = 0;j < 12;j++){
                var card = children[j];
                if(sides[i] == "right"){
                    folds1.unshift(card);
                }
                else{
                    folds1.push(card);
                }
            }
            var folds2 = [];
            for(var j = 12;j < children.length;j++){
                var card = children[j];
                if(sides[i] == "right"){
                    folds2.unshift(card);
                }
                else{
                    folds2.push(card);
                }
            }
            var folds3 = [];
            if(sides[i] == "down"){
                folds3 = folds3.concat(folds2,folds1);
            }
            else{
                folds3 = folds3.concat(folds1,folds2);
            }
            this.allCards.push(folds3);
        }

        for(var i = 0;i < this.allCards[0].length;i++){
            cc.vv.mahjongmgr.addSpriteFrameByMJID(this.allCards[0][i],"d_fold",0);
            this.allCards[0][i].active = false;
        }
        for(var i = 0;i < this.allCards[1].length;i++){
            cc.vv.mahjongmgr.addSpriteFrameByMJID(this.allCards[1][i],"r_peng",0);
            this.allCards[1][i].active = false;
        }
        for(var i = 0;i < this.allCards[2].length;i++){
            cc.vv.mahjongmgr.addSpriteFrameByMJID(this.allCards[2][i],"d_fold",0);
            this.allCards[2][i].active = false;
        }
        for(var i = 0;i < this.allCards[3].length;i++){
            cc.vv.mahjongmgr.addSpriteFrameByMJID(this.allCards[3][i],"l_peng",0);
            this.allCards[3][i].active = false;
        }
    },
    
    chupai : function(data){
        var index = this.mjGame.getLocalIndex(data.userId);
        var seatData = this.mjGame.getSeatDataByID(data.userId);
        var count = seatData.folds.length;
        if(count > this.allCards[index].length){
            count -= this.allCards[index].length;
        }
        var sprite = this.allCards[index][count-1];
        sprite.mjId = data.pai;
        sprite.active = true;
        cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite,data.pai);

        var pos = sprite.getPosition();
        pos.x *= sprite.parent.scaleX;
        pos.x += sprite.parent.getPositionX() + sprite.parent.parent.getPositionX();
        pos.y *= sprite.parent.scaleY;
        pos.y += sprite.parent.getPositionY() + sprite.parent.parent.getPositionY();
        
        //最后一张牌提示
        this._theLastPai.active = true;
        this._theLastPai.setPosition(pos.x,pos.y + 16);
        this._theLastPai.stopAllActions();
        this._theLastPai.runAction(cc.repeatForever(cc.sequence(cc.moveBy(0.3,cc.p(0,20)),cc.moveBy(0.3,cc.p(0,-20)))));
    },

    initFolds:function(seatData){
        var index = this.mjGame.getLocalIndex(seatData.userId);
        for(var i = 0;i < seatData.folds.length;i++){
            var count = i;
            if(count >= this.allCards[index].length){
                count -= this.allCards[index].length;
            }
            var sprite = this.allCards[index][count];
            sprite.mjId = seatData.folds[i];
            sprite.active = true;
            cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite,seatData.folds[i]);
        }
    },
    hideAllFolds:function(){
        for(var i = 0;i < this.allCards.length;i++){
            for(var j = 0;j < this.allCards[i].length;j++){
                this.allCards[i][j].active = false;
            }
        }
    },
    initAllFolds:function(seatDatas){
        for(var i = 0; i < seatDatas.length; ++i){
            this.initFolds(seatDatas[i]);
        }
    },

    changeMJType : function(){
        var sideArr = ["d","lr","d","lr"];
        var typeArr = ["fold","peng","fold","peng"];
        for(var i = 0;i < this.allCards.length;i++){
            var cards = this.allCards[i];
            for(var j = 0;j < cards.length;j++){
                var sprite = cards[j].getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,sideArr[i],typeArr[i]);
            }
        }
    },
});
