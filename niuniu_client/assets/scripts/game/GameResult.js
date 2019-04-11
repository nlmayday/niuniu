cc.Class({
    extends: cc.Component,

    properties: {
        _seats:[],
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        var seats = this.node.getChildByName("seats");
        for(var i = 0; i < seats.children.length; ++i){
            this._seats.push(seats.children[i]);   
        }
    },
    onActive : function(){
        this.node.active = true;
    },
    
    onGameOver:function(endInfo,mjGame){
        var seats = mjGame.seatDatas;
        var maxscore = 0;
        var maxdianpao = 0;
        for(var i = 0; i < 4; ++i){
            if(i >= seats.length){
                this._seats[i].active = false;
                continue;
            }
            var seat = seats[i];
            if(seat.score > maxscore){
                maxscore = seat.score;
            }
            if(endInfo[i].numdianpao > maxdianpao){
                maxdianpao = endInfo[i].numdianpao;
            }
        }

        //房号
        this.node.getChildByName("Label_room").getComponent(cc.Label).string = "房号："+ mjGame.roomId;
        //房主名字
        var self = this;
        var Label_name = this.node.getChildByName("Label_name").getComponent(cc.Label);
        cc.vv.userMgr.getUserBaseInfo(mjGame.owner,function(ret){
            Label_name.string = "房主："+ self.cutName(ret.userName);
        });
        
        //局数
        this.node.getChildByName("Label_times").getComponent(cc.Label).string = "局数："+ mjGame.maxNumOfGames;

        for(var i = 0; i < seats.length; ++i){
            var seat = seats[i];
            var head = this._seats[i].getChildByName("head");
            var fangzhu = head.getChildByName("fangzhu");
            var name = head.getChildByName("name").getComponent(cc.Label);
            var id = head.getChildByName("id").getComponent(cc.Label);
            id.string = "" + seat.userId;
            fangzhu.active = (seat.userId == mjGame.owner);

            var sprite = head.getComponent(cc.Sprite);
            cc.vv.userMgr.getUserBaseInfo(seat.userId,function(ret){
                cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,sprite);
                name.string = self.cutName(ret.userName);
            },sprite,name);
            
            var info = endInfo[i];
            var isBigwin = (seat.score == maxscore) && (maxscore > 0);
            var isZuiJiaPaoShou = (info.numdianpao == maxdianpao) && (maxdianpao > 0);
            this._seats[i].getChildByName("dayingjia").active = isBigwin;
            this._seats[i].getChildByName("zuijiapaoshou").active = isZuiJiaPaoShou;
            this._seats[i].getChildByName("zimocishu").getComponent(cc.Label).string = info.numzimo;
            this._seats[i].getChildByName("dianpaocishu").getComponent(cc.Label).string = info.numdianpao;
            this._seats[i].getChildByName("angangcishu").getComponent(cc.Label).string = info.numangang;
            this._seats[i].getChildByName("minggangcishu").getComponent(cc.Label).string = info.numminggang;
            var score = this._seats[i].getChildByName("score").getComponent(cc.Label);
            if(info.score > 0){
                score.string = "+" + info.score;    
            }
            else{
                score.string = info.score;
            }
        }
    },
    cutName : function(name){
        var retName = "";
        var len = 0;  
        for (var i=0; i<name.length; i++) {  
            if (name.charCodeAt(i)>127 || name.charCodeAt(i)==94) {  
                len += 2;
            } else {  
                len ++;  
            }
            if(len >= 6){
                retName += "...";
                break;
            }
            else{
                retName += name[i];
            }
        }  
        return retName;
    },

    onBtnBackClicked:function(){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        cc.vv.netMgr.wsUri = cc.vv.netMgr.hallUrl;
        cc.vv.netMgr.initLink(function(){
            cc.director.loadScene("Hall");
        },true);
    },
    onBtnSaveClicked:function(){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        cc.vv.anysdkMgr.saveShot();
        cc.vv.prefabMgr.alertOpen(this.node,"提示","已经保存到手机相册！");
    },
    
    onBtnShareClicked:function(){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        //cc.vv.anysdkMgr.shareResult();
    }
});
