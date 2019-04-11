cc.Class({
    properties: {
        allCards : [],
    },

    init(mjGame,gameRoot,sides){
        this.mjGame = mjGame;
        for(var i = 0;i < sides.length;i++){
            var hand = gameRoot.getChildByName(sides[i]).getChildByName("holds");
            var children = hand.children;
            var handCards = [];
            for(var j = 0;j < children.length;j++){
                var card = children[j];
                if(sides[i] == "right"){
                    handCards.unshift(card);
                }
                else{
                    handCards.push(card);
                }
            }
            this.allCards.push(handCards);
        }

        for(var i = 0;i < this.allCards[0].length;i++){
            var card = this.allCards[0][i];
            cc.vv.mahjongmgr.addSpriteFrameByMJID(card,"d_hand",0);
            card.active = false;
            
            card.on(cc.Node.EventType.TOUCH_START, this.onTouchDown, this);
            card.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            card.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            card.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel,this);
        }
        for(var i = 0;i < this.allCards[1].length;i++){
            this.allCards[1][i].active = false;
        }
        for(var i = 0;i < this.allCards[2].length;i++){
            this.allCards[2][i].active = false;
        }
        for(var i = 0;i < this.allCards[3].length;i++){
            this.allCards[3][i].active = false;
        }
    },
    
    initMahjongs:function(seatData){
        var index = this.mjGame.getLocalIndex(seatData.userId);
        var holds = this.sortHolds(seatData);
        
        //初始化手牌
        var lackingNum = seatData.penggangs.length * 3;
        for(var i = 0; i < lackingNum; ++i){
            var sprite = this.allCards[index][i];
            sprite.active = false;
        }
        var count = 0;
        if(holds != null){
            count = holds.length;
        }
        else{
            count = 13 - lackingNum;
            if(this.mjGame.turn == seatData.seatIndex && (this.mjGame.chupai >= 0) == false){
                count += 1;
            }
        }
        for(var i = lackingNum; i < lackingNum + count; ++i){
            var sprite = this.allCards[index][i];
            sprite.active = true;
        }
        for(var i = lackingNum + count; i < this.allCards[index].length; ++i){
            var sprite = this.allCards[index][i];
            sprite.active = false;
        }
        if(holds == null){
            return;
        }
        
        for(var i = 0; i < holds.length; ++i){
            var sprite = this.allCards[index][lackingNum + i];
            sprite.mjId = holds[i];
            cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite,holds[i]);
            if( this.getMJType(holds[i]) == this.mjGame.que){
                sprite.que == true;
                sprite.color = new cc.Color(180,180,180,255);
                sprite.children[0].color = new cc.Color(180,180,180,255);
            }
            else if(sprite.tianTing){
                sprite.color = new cc.Color(128,128,128,255);
                sprite.children[0].color = new cc.Color(128,128,128,255);
            }
            else{
                sprite.que == false;
                sprite.color = new cc.Color(255,255,255,255);
                sprite.children[0].color = new cc.Color(255,255,255,255);
            }
        }
    },

    sortHolds : function(seatData){
        var holds = seatData.holds;
        if(holds == null){
            return null;
        }
        //如果手上的牌的数目是2,5,8,11,14，表示最后一张牌是刚摸到的牌
        var mopai = null;
        var l = holds.length;
        if( l == 2 || l == 5 || l == 8 || l == 11 || l == 14){
            mopai = holds.pop();
        }
        var self = this;
        holds.sort(function(a,b){
            if(self.getMJType(a) == self.mjGame.que && self.getMJType(a) != self.getMJType(b))return 1;
            if(self.getMJType(b) == self.mjGame.que && self.getMJType(a) != self.getMJType(b))return -1;
            return a - b;
        });
        
        //将摸牌添加到最后
        if(mopai != null){
            holds.push(mopai);
        }
        return holds;
    },
    getMJType : function(id) {
        id = parseInt( id );
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
        return -1;
    },
    initAllMahjongs:function(seatDatas){
        for(var i = 0; i < seatDatas.length; ++i){
            this.initMahjongs(seatDatas[i]);
        }
    },
    hideAllMahjongs:function(){
        for(var i = 0;i < 4;i++){
            for(var j = 0;j < this.allCards[i].length;j++){
                this.allCards[i][j].active = false;
            }
        }
    },
    tianTing : function(){
        for(var i = 0;i < this.allCards[0].length-1;i++){
            var card = this.allCards[0][i];
            card.color = new cc.Color(128,128,128,255);
            card.children[0].color = new cc.Color(128,128,128,255);
            card.tianTing = true;
        }
    },
    resume : function(){
        for(var i = 0;i < this.allCards[0].length-1;i++){
            var card = this.allCards[0][i];
            card.color = new cc.Color(255,255,255,255);
            card.children[0].color = new cc.Color(255,255,255,255);
            card.tianTing = false;
        }
    },
    onTouchDown : function(event){
        if(event.target.tianTing)return;
        this.startPos = event.getLocation();
        //如果是再次点击，则出牌
        if(event.target == this._selectedMJ){
            if(this.mjGame.turn != this.mjGame.seatIndex){
                console.log("not your turn." + this.mjGame.turn);
                return;
            }
            if(this.mjGame.chupai >= 0){
                console.log("your have chupai." + this.mjGame.chupai);
                return;
            }
            var mjId = this._selectedMJ.mjId;
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.chupai,mjId);
            cc.vv.audioMgr.playSFX("card_out.mp3","mj");
            this._selectedMJ.y = 0;
            return;
        }
    },
    onTouchMove : function(event){
        if(event.target.tianTing)return;
        var pos = event.getLocation();
        var node = event.target;
        if(this._selectedMJ != null){
            this._selectedMJ.y = 0;
        }
        if(pos.y - this.startPos.y > 60){
            if(this.mjGame.turn != this.mjGame.seatIndex){
                console.log("not your turn." + this.mjGame.turn);
                return;
            }
            if(this.mjGame.chupai >= 0){
                console.log("your have chupai." + this.mjGame.chupai);
                return;
            }
            var mjId = node.mjId;
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.chupai,mjId);
            cc.vv.audioMgr.playSFX("card_out.mp3","mj");
        }
    },
    onTouchEnd : function(event){ 
        if(event.target.tianTing)return;
        if(this._selectedMJ != null){
            this._selectedMJ.y = 0;
        }
        if(event.target == this._selectedMJ){
            this._selectedMJ = null;
        }
        else{
            cc.vv.audioMgr.playSFX("card_click.mp3","mj");
            event.target.y = 30;
            this._selectedMJ = event.target;
        }
        //this.showHuTips();      
    },
    onTouchCancel : function(){
        if(this._selectedMJ != null){
            this._selectedMJ.y = 0;
            this._selectedMJ = null;
        }
    },

    changeMJType : function(){
        var sideArr = ["d","r","u","l"];
        for(var i = 0;i < this.allCards.length;i++){
            var cards = this.allCards[i];
            for(var j = 0;j < cards.length;j++){
                var sprite = cards[j].getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,sideArr[i],"hand");
            }
        }
    },
});
