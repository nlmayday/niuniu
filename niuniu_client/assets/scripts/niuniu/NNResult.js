cc.Class({
    extends: cc.Component,

    properties: {
        _seats:[],
    },

    // use this for initialization
    onLoad: function () {
        
    },
    init : function () {
        var seats = this.node.getChildByName("seats");
        for(var i = 0; i < seats.children.length; ++i){
            this._seats.push(seats.children[i]);   
        }
    },
    onGameOver:function(nnGame,endInfo,endTime){
        this.node.active = true;
        //房号
        this.node.getChildByName("Label_room").getComponent(cc.Label).string = "房号 : "+ nnGame.roomId;
        //房主名字
        var self = this;
        var Label_name = this.node.getChildByName("Label_name").getComponent(cc.Label);
        cc.vv.userMgr.getUserBaseInfo(nnGame.owner,function(ret){
            Label_name.string = "房主 : "+ cc.vv.utils.cutString(ret.userName,12);
        });
        //局数
        this.node.getChildByName("Label_times").getComponent(cc.Label).string = "局数 : " + nnGame.numOfGames + "/" + nnGame.maxNumOfGames;

        this.node.getChildByName("Label_difen").getComponent(cc.Label).string = "底分 : " + nnGame.difen;
        this.node.getChildByName("Label_time").getComponent(cc.Label).string = "时间 : " + cc.vv.utils.dateFormat("yyyy-MM-dd hh:mm:ss",endTime);

        var seatDatas = nnGame.seatDatas;
        var selfScore = 0;
        for(var k=0;k<endInfo.length;k++){
            if(endInfo[k].userId == cc.vv.userMgr.userId){
                selfScore = endInfo[k].score;
                break;
            }
        }
        if(selfScore >= 0){
            cc.vv.audioMgr.playSFX("win.mp3","niuniu");
            this.node.getChildByName("win").active = true;
            this.node.getChildByName("lose").active = false;
        }
        else {
            cc.vv.audioMgr.playSFX("lose.mp3","niuniu");
            this.node.getChildByName("win").active = false;
            this.node.getChildByName("lose").active = true;
        }
        var j = 0;
        for(var i = 0; i < this._seats.length; ++i){
            var seat = this._seats[i];
            if(i >= endInfo.length){
                seat.active = false;
                continue;
            }

            var info = endInfo[i];
            var seatData = null;
            for(var k=j;k<seatDatas.length;k++){
                seatData = seatDatas[k];
                if(seatData == null || seatData.userId != info.userId)continue;
                j = k+1;
                break;
            }
            if(seatData == null || seatData.userId != info.userId)continue;
            seat.active = true;
            var head = seat.getChildByName("head");
            var name = head.getChildByName("name").getComponent(cc.Label);
            var id = head.getChildByName("id").getComponent(cc.Label);
            id.string = "" + seatData.userId;

            var sprite = head.getComponent(cc.Sprite);
            cc.vv.userMgr.getUserBaseInfo(seatData.userId,function(ret){
                cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,sprite);
                name.string = cc.vv.utils.cutString(ret.userName,12);
            },sprite,name);
            
            seat.getChildByName("shangzhuang").getComponent(cc.Label).string = "上庄次数 : " + info.shangzhuang;
            seat.getChildByName("niuniu").getComponent(cc.Label).string = "牛牛次数 : " + info.niuniu;
            seat.getChildByName("win").getComponent(cc.Label).string = "胜利次数 : " + info.win;
            
            var score1 = seat.getChildByName("score1").getComponent(cc.Label);
            var score2 = seat.getChildByName("score2").getComponent(cc.Label);
            if(info.score >= 0){
                score1.node.active = true;
                score2.node.active = false;
                score1.string = "+" + info.score;    
            }
            else{
                score1.node.active = false;
                score2.node.active = true;
                var score = info.score;
                score2.string = "" + score;
            }
        }
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
        cc.vv.anysdkMgr.shareResult(1);
    }
});
