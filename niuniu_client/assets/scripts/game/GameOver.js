cc.Class({
    extends: cc.Component,

    properties: {
        _seats:[],
        
        _jushu:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }

        this._jushu = this.node.getChildByName("Label_jushu").getComponent(cc.Label);
        var listRoot = this.node.getChildByName("result_list");
        for(var i = 1; i <= 4; ++i){
            var s = "s" + i;
            var sn = listRoot.getChildByName(s);
            
            var viewdata = {};
            viewdata.penggangs = sn.getChildByName("penggangs");
            viewdata.head = sn.getChildByName("head");
            viewdata.username = viewdata.head.getChildByName('username').getComponent(cc.Label);
            viewdata.zhuang = viewdata.head.getChildByName('zhuang');
            viewdata.reason1 = sn.getChildByName('reason_1');
            viewdata.reason2 = sn.getChildByName('reason_2');
            viewdata.reason3 = sn.getChildByName('reason_3');
            
            viewdata.cardType = sn.getChildByName('cardType').getComponent(cc.Label);
            viewdata.score = sn.getChildByName('score').getComponent(cc.Label);
            viewdata.hu = sn.getChildByName('hu');
            viewdata.mahjongs = sn.getChildByName('pai');

            this._seats.push(viewdata);
        }
        
        this._game_result = this.node.parent.getChildByName("game_result").getComponent("GameResult");
        
    },

	onGameOver(data,mjGame){
        this.node.active = true;
        this.mjGame = mjGame;
        this._isGameEnd = mjGame.isOver;
        this._jushu.string = "" + mjGame.numOfGames + "/" + mjGame.maxNumOfGames;

        var myscore = data[mjGame.seatIndex].score;
        if(myscore > 0){
            //this._win.active = true;
            cc.vv.audioMgr.playSFX("win.mp3");
        }         
        else if(myscore < 0){
            //this._lose.active = true;
            cc.vv.audioMgr.playSFX("lose.mp3");
        }
        if(mjGame.mjRoom.huType == ""){
            //this._pingju.active = true;
            cc.vv.audioMgr.playSFX("liuju.mp3");
        }
        
        //显示玩家信息
        var numOfPlayer = mjGame.numOfPlayer;
        for(var i = 0; i < 4; ++i){
            var seatView = this._seats[i];
            if(i >= numOfPlayer){
                seatView.head.parent.active = false;
                continue;
            }
            seatView.username.string = this.cutName(mjGame.seatDatas[i].userName);
            seatView.zhuang.active = (mjGame.turn == i);
            
            var head = seatView.head.getComponent(cc.Sprite);
            var userData = data[i];
            cc.vv.userMgr.getUserBaseInfo(userData.userId,function(ret){
                cc.vv.headImgLoader.loadsync(ret.headImg,ret.sex,head);
            },head);
            //输赢判断
            /*if(userData.score > 0){
                seatView.lost.active = false;
                seatView.win.active = true;
            }
            else {
              seatView.lost.active = true;
              seatView.win.active = false;   
            }*/
            
            //胡牌的玩家才显示 是否清一色 根xn的字样
            var hued = false;
            var actionArr = [];
            var mytype = 0;
            for(var j = 0; j < userData.actions.length; ++j){
                mytype = 0;
                var ac = userData.actions[j];
                if(ac.type == "hu" || ac.type == "zimo" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "qiangganghu"){
                    if(ac.type == "zimo"){
                        actionArr.push("自摸");
                        mytype = 1;
                    }
                    else if(ac.type == "ganghua"){
                        actionArr.push("杠上花");
                        mytype = 3;
                    }
                    else if(ac.type == "dianganghua"){
                        actionArr.push("点杠花");
                        mytype = 3;
                    }
                    else if(ac.type == "qiangganghu"){
                        actionArr.push("抢杠胡");
                    }
                    hued = true;
                }
                else if(ac.type == "fangpao"){
                    actionArr.push("放炮");
                    mytype = 2;
                }
                else if(ac.type == "angang"){
                    //actionArr.push("暗杠");
                    actionArr.push("闷豆");
                }
                else if(ac.type == "diangang"){
                    //actionArr.push("明杠");
                    actionArr.push("点豆");
                }
                else if(ac.type == "wangang"){
                    //actionArr.push("弯杠");
                    actionArr.push("爬坡豆");
                }
                else if(ac.type == "fanggang"){
                   actionArr.push("放杠");
                }
                else if(ac.type == "zhuanshougang"){
                    //actionArr.push("转手杠");
                    actionArr.push("憨包豆");
                }
                else if(ac.type == "beiqianggang"){
                    actionArr.push("被抢杠");
                }
            }
            
            if(hued){
                if(userData.pinghu)actionArr.push("平胡");
                if(userData.long7dui)actionArr.push("龙七对");
                if(userData.is7dui)actionArr.push("七对");
                if(userData.dandiao)actionArr.push("单吊");
                if(userData.daduizi)actionArr.push("大对子");

                if(userData.qinglongbei)actionArr.push("青龙背");
                if(userData.qing7dui)actionArr.push("清七对");
                if(userData.qingdandiao)actionArr.push("清单吊");
                if(userData.qingdadui)actionArr.push("清大对");
                if(userData.qingyise)actionArr.push("清一色");
                
                if(userData.isTianTing)actionArr.push("天听");
                if(userData.isTianHu)actionArr.push("天胡");
                if(userData.isDiHu)actionArr.push("地胡");

                if(userData.chongfengji)actionArr.push("冲锋鸡");
                if(userData.zerenji)actionArr.push("责任鸡");
            }
            
            actionArr.push("" + userData.jiCount + "只鸡" + userData.jifen + "分");
            actionArr.push("胡牌" + userData.score + "分");
            actionArr.push("赔" + userData.peifen + "分");
            
            seatView.cardType.string = actionArr.join("、");
            if(hued){
                seatView.hu.active = true;
            }
            else{
                seatView.hu.active = false;
            }
            //seatView.fan.string = "" + userData.fan + "番";
            
            //
            if(userData.totalScore > 0){
                seatView.score.string = "+" + userData.totalScore;    
            }
            else{
                seatView.score.string = userData.totalScore;
            }
            
            //自摸、点炮、杠上开花
            if(mytype == 1){
                seatView.reason1.active = true;
                seatView.reason2.active = false;
                seatView.reason3.active = false;
            }
            else if(mytype == 2){
                seatView.reason1.active = false;
                seatView.reason2.active = true;
                seatView.reason3.active = false;
            }
            else if(mytype == 3){
                seatView.reason1.active = false;
                seatView.reason2.active = false;
                seatView.reason3.active = true;
            }
            else {
                seatView.reason1.active = false;
                seatView.reason2.active = false;
                seatView.reason3.active = false;
            }
           
            var hupai = -1;
            if(hued){
                hupai = userData.holds.pop();
            }
            
            userData.holds.sort(function(a,b){
                return a - b;
            });
            
            //胡牌不参与排序
            if(hued){
                userData.holds.push(hupai);
            }
            
            //隐藏所有牌
            for(var k = 0; k < seatView.mahjongs.childrenCount; ++k){
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }
           
            var lackingNum = userData.penggangs.length * 3; 
            //显示相关的牌
            for(var k = 0; k < userData.holds.length; ++k){
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                cc.vv.mahjongmgr.addSpriteFrameByMJID(n,"d_peng",pai);
                
                if(!hued && k + lackingNum == 13){
                    var childSprite = n.getComponentInChildren(cc.Sprite);
                    if(childSprite)childSprite.node.active = false;
                }
            }

            var children = seatView.penggangs.children;
            for(var k = 0;k<children.length;k++){
                children[k].active = false;
            }
            //初始化碰杠牌
            var gangs = userData.angangs;
            for(var k2 = 0; k2 < userData.penggangs.length; ++k2){
                var type = userData.penggangs[k2][0];
                var mjid = userData.penggangs[k2][1];
                this.initPengAndGangs(seatView.penggangs,k2,type,mjid);  
            }
        }
    },
    initPengAndGangs:function(parent,index,type,mjId){
        var pgroot = null;
        if(parent.childrenCount <= index){
            pgroot = cc.instantiate(this.mjGame.penggangDown);
            parent.addChild(pgroot);    
        }
        else{
            pgroot = parent.children[index];
            pgroot.active = true;
        }
        pgroot.y = -14;
        pgroot.x = 80 + index * 80 * 3;
        
        var sideArr = ["d","lr","u","lr"];
        var sprites = pgroot.children;
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s].getComponent(cc.Sprite);
            if(sprite.node.name == "gang"){
                var isGang = type != "peng" && type != "chi";
                sprite.node.active = isGang; 

                sprite.node.getChildByName("mj").active = true;
                cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite.node,mjId);
                
            }
            else if(type == "angang"){
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,"d","gang");
                sprite.node.getChildByName("mj").active = false;
            }
            else if(type == "chi"){
                sprite.node.getChildByName("mj").active = true;
                cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite.node,mjId.chi[s]);
            }
            else{ 
                sprite.node.getChildByName("mj").active = true;
                cc.vv.mahjongmgr.setSpriteFrameByMJID(sprite.node,mjId);
            }
        }
    },
    changeMJType : function(){
        for(var i=0;i<this._seats.length;i++){
            var children1 = this._seats[i].penggangs.children;
            for(var j=0;j<children1.length;j++){
                var children2 = children1[j].children;
                for(var s = 0; s < children2.length; ++s){
                    var sprite = children2[s].getComponent(cc.Sprite);
                    var type = "peng";
                    sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,"d",type);
                }
            }
        }
        for(var i=0;i<this._seats.length;i++){
            var children = this._seats[i].mahjongs.children;
            for(var s = 0; s < children.length; ++s){
                var sprite = children[s].getComponent(cc.Sprite);
                var type = "peng";
                sprite.spriteFrame = cc.vv.mahjongmgr.getMJBG(cc.vv.mjType,"d",type);
            }
        }
    },
    onBtnReadyClicked:function(){
        cc.vv.audioMgr.playSFX("btn3.mp3");
        if(this._isGameEnd){
            this._game_result.onActive();
        }
        else{
            //准备要传参数 1 等同 true
            cc.vv.netMgr.doSend2(cc.vv.netMgr.req.ready,1);
        }
        this.node.active = false;
    },
    
    onBtnShareClicked:function(){
        cc.vv.audioMgr.playSFX("btn3.mp3");
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
    }
});
