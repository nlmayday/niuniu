
cc.Class({
    extends: cc.Component,

    properties: {
        pukerAtlas : {        
            default : null,
            type:cc.SpriteAtlas
        },
        qiang : {
            default : [],
            type : cc.SpriteFrame,
        },
        xiazhu : {
            default : [],
            type : cc.SpriteFrame,
        },
        allNiu : {        
            default : [],
            type : cc.SpriteFrame
        },
        holds : cc.Node,
        cuopai : cc.Node,
    },

    // use this for initialization
    init: function (nnGame) {
        this.nnGame = nnGame;

        this.allCards = [];    //所有扑克精灵
        this.puker = [];       //所有扑克精灵
        this.allPos = [];
        this.seats = [];
        this.allHolds = [];
        this.niuNodes = [];
        this.allDone = [];
        var child = this.node.children;
        for(var i = 0;i < child.length;i++){
            var user = child[i].getComponent("NNUser");
            user.onLoad();
            this.seats.push(user);
            this.allPos.push(child[i].getPosition());

            var allHolds = this.allHolds[i] = [];
            var children = this.holds.children[i].children;
            for(var j = 0;j < 5;j++){
                allHolds.push(children[j]);
            }
            this.niuNodes.push(children[5].getComponent(cc.Sprite));
            if(i != 0){
                children[6].active = false;
                this.allDone.push(children[6]);
            }
            child[i].active = false;
        }

        this.kaipaiId = {}; //存储计时器id
        this.kaipaiArr = {};
        this.hideAllHolds();
    },

    initSeats:function(seatDatas){
        for(var i = 0;i < this.seats.length;i++){
            this.seats[i].node.active = false;
        }
        for(var i = 0; i < seatDatas.length; ++i){
            this.initSingleSeat(seatDatas[i]);
        }
    },
    onSit:function(){
        this.seats[0].node.active = true;
    },
    initSingleSeat:function(seatData){
        if(seatData == null || seatData.userId <= 0)return;
        var index = this.nnGame.getLocalIndex(seatData.userId);
        var isOwner = seatData.userId == this.nnGame.owner;
        this.seats[index].setUserInfo(seatData);
        this.seats[index].refresh();
        this.seats[index].setOwner(isOwner);
        this.setOnline(seatData);
        this.setReady(seatData);
        this.setScore(seatData);
        if(seatData.userId == cc.vv.userMgr.userId && seatData.sit == 0){
            this.seats[index].node.active = false;
        }
    },
    posMove:function(userId){
        if(userId <= 0)return;
        var index = this.nnGame.getLocalIndex(userId);
        var seat = this.seats[index];
        var pos = this.allPos[index];
        seat.node.stopAllActions();
        seat.node.runAction(cc.sequence(cc.place(cc.p(0,0)),cc.moveTo(0.5,pos).easing(cc.easeExponentialOut(3.0)))); 
    },
    kick : function(seatData){
        var userId = seatData.userId;
        var index = this.nnGame.getLocalIndex(userId);
        var seat = this.seats[index];
        var kick_time = 30 - seatData.kick_time;
        var kuang = seat.node.getChildByName("kuang");
        kuang.active = true;
        var sprite = kuang.getComponent(cc.Sprite);
        sprite.fillRange = Math.floor(kick_time / 30 * 100) / 100;
        kuang.colorR = 0;
        kuang.colorG = 255;
        kuang.runAction(cc.repeatForever(cc.sequence(cc.delayTime(0.03),cc.callFunc(function(){
            sprite.fillRange += 0.001;
            var change = 0.512;
            if(kuang.colorR >= 255){
                kuang.colorG -= change;
                if(kuang.colorG < 0){
                    kuang.colorG = 0;
                }
            }
            else{
                kuang.colorR += change;
                if(kuang.colorR > 255){
                    kuang.colorR = 255;
                }
            }
            kuang.color = new cc.Color(parseInt(kuang.colorR),parseInt(kuang.colorG),0);
            if(sprite.fillRange >= 1){
                kuang.stopAllActions();
                kuang.active = false;
            }
        }))));
    },
    fapai : function(callback){
        for(var i = 0; i < this.allHolds.length; ++i){
            var allHolds = this.allHolds[i];
            allHolds[0].parent.getComponent(cc.Animation).stop();
        }

        var anim = this.holds.getComponent(cc.Animation);
        anim.play("fapai");
        anim.on("finished",callback);

        setTimeout(function(){
            cc.vv.audioMgr.playSFX("fapai1.mp3","niuniu");
        },80);
        setTimeout(function(){
            cc.vv.audioMgr.playSFX("fapai2.mp3","niuniu");
        },250);
        setTimeout(function(){
            cc.vv.audioMgr.playSFX("fapai2.mp3","niuniu");
        },450);
        setTimeout(function(){
            cc.vv.audioMgr.playSFX("fapai2.mp3","niuniu");
        },650);
        setTimeout(function(){
            cc.vv.audioMgr.playSFX("fapai2.mp3","niuniu");
        },850);
        
    },
    showHolds : function(userId,holds){
        var index = this.nnGame.getLocalIndex(userId);
        var allHolds = this.allHolds[index];
        
        if(index == 0){
            var hold = holds[holds.length-1];
            var sprite2 = this.cuopai.getChildByName("front").getComponent(cc.Sprite);
            if(this.allCards[hold] && this.puker[hold]){
                sprite2.spriteFrame = this.allCards[hold];
                sprite2.node.getChildByName("value1").getComponent(cc.Sprite).spriteFrame = this.puker[hold];
                sprite2.node.getChildByName("value2").getComponent(cc.Sprite).spriteFrame = this.puker[hold];
            }
            else{
                this.loadPuker(sprite2,hold);
            }
        }
        for(var j = 0; j < holds.length; ++j){
            //if(index == 0 && j != holds.length - 1)continue;
            var parent = allHolds[j];
            var hold = holds[j];
            
            var value = Math.floor(hold / 10);
            var type = hold % 10;
            var name1 = "";
            
            if(value == 11){
                name1 = "J";
            }
            else if(value == 12){
                name1 = "Q";
            }
            else if(value == 13){
                name1 = "K";
            }
            else{
                name1 = "" + value;
            }
            name1 += type;

            var sprite = parent.getComponent(cc.Sprite);
            sprite.spriteFrame = this.pukerAtlas.getSpriteFrame(name1);
        }
        
    },
    kanpai : function(userId){
        if(userId <= 0)return;
        var index = this.nnGame.getLocalIndex(userId);
        if(index <= 0)return;
        var done = this.allDone[index-1];
        done.active = true;
    },
    kanpai2 :function(){
        var length = this.allHolds[0].length;
        var holds = this.allHolds[0][length-1];
        var anim = holds.getComponent(cc.Animation);
        anim.play("kanpai");
    },
    kaipai : function(userId,niu){
        if(userId <= 0)return;
        var index = this.nnGame.getLocalIndex(userId);
        var holds = this.allHolds[index][0].parent;
        
        var self = this;
        var niu1 = niu;
        if(niu < 0)niu1 = 0;
        if(this.kaipaiId[index] > 0){
            clearTimeout(this.kaipaiId[index]);
            this.kaipaiId[index] = -1;
        }
        
        if(index == 0){
            var anim = holds.getComponent(cc.Animation);
            anim.play("kaipai1");
        }
        else{
            var done = self.allDone[index-1];
            done.active = false;
            var anim = holds.getComponent(cc.Animation);
            anim.play("kaipai2");
        }
        this.kaipaiId[index] = setTimeout(function(){
            if(niu1 >= 0){
                self.nnGame.playSFX("niu_" + niu1 + ".mp3",userId);
            }
            if(niu1 > 17)return;
            self.niuNodes[index].node.active = true;
            self.niuNodes[index].spriteFrame = self.allNiu[niu1];        
        },500);
    },
    stopKaipai : function(){
        for(var i = 0; i < this.allHolds.length; ++i){
            var allHolds = this.allHolds[i];
            allHolds[0].parent.getComponent(cc.Animation).stop();
        }
        for(var index in this.kaipaiId){
            if(this.kaipaiId[index] > 0){
                clearTimeout(this.kaipaiId[index]);
                this.kaipaiId[index] = -1;
            }
        }
        
    },
    zhengli : function(seatData){
        if(seatData.userId <= 0)return;
        var index = this.nnGame.getLocalIndex(seatData.userId);
        var holds = this.allHolds[index][0].parent;
        
        if(index == 0){
            var anim = holds.getComponent(cc.Animation);
            anim.play("zhengli1");
        }
        else{
            var anim = holds.getComponent(cc.Animation);
            anim.play("zhengli2");
        }
    },
    initHolds : function(seatData){
        if(seatData.userId <= 0)return;
        var index = this.nnGame.getLocalIndex(seatData.userId);
        var allHolds = this.allHolds[index];
        allHolds[0].parent.active = true;
        if(index != 0){
            return;
        }

        for(var i = 0; i < seatData.holds.length; ++i){
            var parent = allHolds[i];
            var hold = seatData.holds[i];
            if(hold == -1){
                continue;
            }
            
            var value = Math.floor(hold / 10);
            var type = hold % 10;

            var name1 = "";
            if(value == 11){
                name1 = "J";
            }
            else if(value == 12){
                name1 = "Q";
            }
            else if(value == 13){
                name1 = "K";
            }
            else{
                name1 = "" + value;
            }
            name1 += type;

            var sprite = parent.getComponent(cc.Sprite);
            sprite.spriteFrame = this.pukerAtlas.getSpriteFrame(name1);
        }
    },
    loadPuker :function(sprite,hold){
        var value = Math.floor(hold / 10);
        var type = hold % 10;
        var name = "" + hold;
        var name2 = "";
        var type2 = "";
        if(type == 1 || type == 3){
            type2 = "black_";
        }
        else{
            type2 = "red_";
        }
        if(value == 11){
            name = "J" + type;
            name2 = "J";
        }
        else if(value == 12){
            name = "Q" + type;
            name2 = "Q";
        }
        else if(value == 13){
            name = "K" + type;
            name2 = "K";
        }
        else{
            name2 = "" + value;
        }
        var name3 = type2 + name2;
        var self = this;
        cc.loader.loadRes("textures/niuniu/puker/" + name,function(err, tex){
            if( err ){
                console.error(err);
                return;
            }
            var spriteFrame = new cc.SpriteFrame(tex,cc.Rect(0, 0, tex.width, tex.height));
            if( spriteFrame ){
                sprite.spriteFrame = spriteFrame;
                self.allCards[hold] = spriteFrame;
            }
        });
        cc.loader.loadRes("textures/niuniu/puker/" + name3,function(err, tex){
            if( err ){
                console.error(err);
                return;
            }
            var spriteFrame = new cc.SpriteFrame(tex,cc.Rect(0, 0, tex.width, tex.height));
            if( spriteFrame ){
                sprite.node.getChildByName("value1").getComponent(cc.Sprite).spriteFrame = spriteFrame;
                sprite.node.getChildByName("value2").getComponent(cc.Sprite).spriteFrame = spriteFrame;
                self.puker[hold] = spriteFrame;
            }
        });
    },

    hideHolds:function(seatData){
        if(seatData.userId <= 0)return;
        var index = this.nnGame.getLocalIndex(seatData.userId);
        var allHolds = this.allHolds[index];
        allHolds[0].parent.active = false;
    },
    hideAllHolds:function(){
        for(var i = 0; i < this.allHolds.length; ++i){
            var allHolds = this.allHolds[i];
            for(var j=0;j<allHolds.length;j++){
                allHolds[j].getChildByName("back").active = true;
            }
            allHolds[0].parent.active = false;
        }
        for(var i = 0; i < this.niuNodes.length; ++i){
            this.niuNodes[i].node.active = false;
        }
    },
    hideBackHolds:function(seatData){
        if(seatData.userId <= 0)return;
        var index = this.nnGame.getLocalIndex(seatData.userId);
        if(index != 0){
            return;
        }
        var allHolds = this.allHolds[index];
        for(var j=0,k=0;j<allHolds.length,k<4;j++,k++){
            allHolds[j].getChildByName("back").active = false;
        }
        
    },
    setOnline : function(data){
        var index = this.nnGame.getLocalIndex(data.userId);
        this.seats[index].setOnline(data.online);
    },
    setReady : function(data){
        var index = this.nnGame.getLocalIndex(data.userId);
        var ready = data.ready?true:false;
        this.seats[index].setReady(ready);

        if(ready){
            var kuang = this.seats[index].node.getChildByName("kuang");
            kuang.stopAllActions();
            kuang.active = false;
        }     
    },
    tickStop : function(userId){
        var index = this.nnGame.getLocalIndex(userId);
        var kuang = this.seats[index].node.getChildByName("kuang");
        kuang.stopAllActions();
        kuang.active = false;
    },
    
    dingzhuang : function(userId,userArr,callback){
        var index = this.nnGame.getLocalIndex(userId);
        
        this.dingzhuangIndex = 0;
        this.dingzhuangCount = 0;
        if(this.lastDingzhuang){
            this.lastDingzhuang.active = false;
            this.lastDingzhuang = null;
        }
        var self = this;
        self.interval = function(){
            var userId2 = userArr[self.dingzhuangIndex];
            var index2 = self.nnGame.getLocalIndex(userId2);
            var node = self.seats[index2].node.getChildByName("dingzhuang");
            node.active = true;
            if(self.lastDingzhuang)self.lastDingzhuang.active = false;
            self.lastDingzhuang = node;
            cc.vv.audioMgr.playSFX("qiang.mp3","niuniu");
            self.intervalId = -1;
            if(self.dingzhuangCount > 12 && index2 == index){
                node.runAction(cc.sequence(cc.delayTime(1),cc.scaleTo(0.1,0.9),cc.callFunc(function(){
                    cc.vv.audioMgr.playSFX("zhuang.mp3","niuniu");
                    callback();
                    //node.active = false;
                    node.scaleX = 0.8;
                    node.scaleY = 0.8;
                })));
                return;
            }
            self.dingzhuangIndex += 1;
            self.dingzhuangIndex %= userArr.length;
            self.dingzhuangCount += 1;
            self.intervalId = setTimeout(self.interval,100);
        }
        self.interval();
        
    },
    stopDingzhuang : function(){
        if(this.lastDingzhuang)this.lastDingzhuang.active = false;
        if(this.intervalId > 0){
            clearTimeout(this.intervalId);
            this.intervalId = -1;
        }
    },

    setZhuang : function(userId){
        if(this.lastDingzhuang)this.lastDingzhuang.active = false;
        var index = this.nnGame.getLocalIndex(userId);
        for(var i = 0; i < this.seats.length; ++i){
            if(i == index){
                this.seats[i].setZhuang(true);
                var node = this.seats[i].node.getChildByName("dingzhuang");
                this.lastDingzhuang = node;
                node.active = true;
            }
            else this.seats[i].setZhuang(false);
        }
    },
    setScore : function(data){
        var index = this.nnGame.getLocalIndex(data.userId);
        var seat = this.seats[index];
        seat.setScore(data.coins);
    },
    addScore : function(data){
        var index = this.nnGame.getLocalIndex(data.userId);
        var seat = this.seats[index];
        if(index == 0){
            cc.vv.audioMgr.playSFX("piaofen.mp3","niuniu");
        }
        var self = this;
        var numOfGames = self.nnGame.numOfGames;
        seat.addScore(data.score,function(){
            seat.setScore(data.coins);
            if(self.nnGame.numOfGames == numOfGames){
                self.nnGame.seats.setZhuang(0);
                self.nnGame.seats.hideAllHolds();
                self.nnGame.seats.stopDingzhuang();
            }
        });
    },

    qiangzhuang : function(userId,value){
        var index = this.nnGame.getLocalIndex(userId);
        var spriteFrame = null;
        if(value >= 0 && value < 5){
            spriteFrame = this.qiang[value];
            if(value == 0){
                this.nnGame.playSFX("buqiang.mp3",userId);
            }
            else{
                this.nnGame.playSFX("qiangzhuang.mp3",userId);
            }
        }
        this.seats[index].qiangzhuang(spriteFrame);
    },
    setQiang : function(userId,value){
        var index = this.nnGame.getLocalIndex(userId);
        var spriteFrame = null;
        if(value >= 0 && value < 5){
            spriteFrame = this.qiang[value];
        }
        this.seats[index].setQiang(spriteFrame);
    },
    setXiazhu : function(userId,value,isSync){
        var index = this.nnGame.getLocalIndex(userId);
        var spriteFrame = null;
        if(value > 0 && value <= 5){
            spriteFrame = this.xiazhu[value-1];
            if(isSync != true){
                if(value == 5){
                    cc.vv.audioMgr.playSFX("goldbar.mp3","niuniu");
                }
                else{
                    cc.vv.audioMgr.playSFX("xiazhu.mp3","niuniu");
                }
                this.nnGame.playSFX("bei" + value + ".mp3",userId);
            }
        }
        this.seats[index].setXiazhu(spriteFrame);
        
        var spriteFrame2 = null;
        if(value > 0 && value <= 5){
            spriteFrame2 = this.qiang[value + 4];
        }
        this.seats[index].setQiang(spriteFrame2);
    },

    exit : function(userId){
        var index = this.nnGame.getLocalIndex(userId);
        this.seats[index].node.active = false;
    },

    chat:function(userId,content){
        var index = this.nnGame.getLocalIndex(userId);
        this.seats[index].chat(content,index);
    },
    
    emoji:function(userId,content){
        var index = this.nnGame.getLocalIndex(userId);
        this.seats[index].emoji(content,index);
    },
    
    voiceMsg:function(userId,content){
        var index = this.nnGame.getLocalIndex(userId);
        this.seats[index].voiceMsg(content);
    },

    magic : function(userId2,content){
        var index2 = this.nnGame.getLocalIndex(userId2);
        this.seats[index2].magic(content);
    },
});
