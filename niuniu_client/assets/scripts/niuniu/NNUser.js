cc.Class({
    extends: cc.Component,

    properties: {
        //节点
        _headImg:null,
        _userName:null,
        _userId:null,
        _sex1:null,
        _sex2:null,
        _lv:null,
        _ip:null,
        _gems:null,
        _coins:null,
        _cards:null,
        //user数据
        _userInfo : null,
    },

    // use this for initialization
    onLoad : function () {
        var headImg = this.getChild_safe(this.node,"frame/icon");
        if(headImg)this._headImg = headImg.getComponent(cc.Sprite);

        var userName = this.getChild_safe(this.node,"name");
        if(userName)this._userName = userName.getComponent(cc.Label);
        
        var userId = this.getChild_safe(this.node,"userId");
        if(userId)this._userId = userId.getComponent(cc.Label);

        var _sex1 = this.getChild_safe(this.node,"sex1");
        var _sex2 = this.getChild_safe(this.node,"sex2");

        var ip = this.getChild_safe(this.node,"ip");
        if(ip)this._ip = ip.getComponent(cc.Label);
        
        var coins = this.getChild_safe(this.node,"coins");
        if(coins)this._coins = coins.getComponent(cc.Label);

        var cards = this.getChild_safe(this.node,"cards/cards");
        if(cards)this._cards = cards.getComponent(cc.Label);

        var score = this.getChild_safe(this.node,"score");
        if(score)this._score = score.getComponent(cc.Label);

        this._chatBubble = this.getChild_safe(this.node,"ChatBubble");
        this._voicemsg = this.getChild_safe(this.node,"voicemsg");

        this._magic = this.getChild_safe(this.node,"magic");

        this._owner = this.getChild_safe(this.node,"owner");
        this._zhuang = this.getChild_safe(this.node,"zhuang");
        this._ready = this.getChild_safe(this.node,"ready");
        this._offline = this.getChild_safe(this.node,"offline");
        var qiang = this.getChild_safe(this.node,"qiang/qiang");
        if(qiang)this._qiang = qiang.getComponent(cc.Sprite);
        var beishu = this.getChild_safe(this.node,"beishu");
        if(beishu)this._beishu = beishu.getComponent(cc.Sprite);
        var xiazhu = this.getChild_safe(this.node,"xiazhu");
        if(xiazhu)this._xiazhu = xiazhu.getComponent(cc.Sprite);
        this.qiangzhuang();
        this.setQiang();
        this.setXiazhu();

        this.setOnline(true);
        this.setReady(false);
        this.setOwner(false);
        this.setZhuang(false);

        this._win = this.getChild_safe(this.node,"win");
        this._lose = this.getChild_safe(this.node,"lose");
        if(this._win){
            this._win.active = false;
        }
        if(this._lose){
            this._lose.active = false;
        }
    },
    getChild_safe:function(node,name){
        var arr = name.split("/");
        var child = node;
        for(var i=0;i<arr.length;i++){
            child = child.getChildByName(arr[i]);
            if(child == null){
                return null;
            }
        }
        return child;
    },
    setUserInfo : function(userInfo){
        this._userInfo = userInfo;
    },
    refresh : function(){
        if(this._userInfo == null){
            console.log("user脚本_userInfo未赋值");
            return;
        }
        if(this._headImg){
            var headImg = this._headImg;
            if(this._userInfo.headImg){
                cc.vv.headImgLoader.load(this._userInfo.headImg,function(spriteFrame){
                    headImg.spriteFrame = spriteFrame;
                },this._userInfo.sex);
            }
            else if(this._userInfo.userId){
                cc.vv.userMgr.getUserBaseInfo(this._userInfo.userId,function(ret){
                    cc.vv.headImgLoader.load(ret.headImg,function(spriteFrame){
                        headImg.spriteFrame = spriteFrame;
                    },ret.sex);
                });
            }
        }
        
        if(this._userName){
            this._userName.string = cc.vv.utils.cutString(this._userInfo.userName,9);
        }
        
        if(this._userId){
            this._userId.string = "" + this._userInfo.userId;            
        }        
        
        if(this._sex1)this._sex1.active = this._userInfo.sex == 1;
        if(this._sex2)this._sex2.active = this._userInfo.sex == 2;   
        
        if(this._ip){
            this._ip.string = this._userInfo.ip; 
        }
        
        if(this._coins){
            this._coins.string = "" + this._userInfo.coins;    
        }

        if(this._cards){
            this._cards.string = "" + this._userInfo.roomCard;    
        }
        this.node.active = this._userInfo.userName != null;
    },

    refreshMoney : function(data){
        if(data.gems != null && this._gems){
            this._gems.string = "" + data.gems;    
        }
        
        if(data.coins != null && this._coins){
            this._coins.string = "" + data.coins;    
        }

        if(data.roomCard != null && this._cards){
            this._cards.string = "" + data.roomCard;    
        }
    },
    setOnline : function(value){
        if(this._offline)this._offline.active = !value;
    },
    setReady : function(value){
        if(this._ready)this._ready.active = value;
    },
    setOwner : function(value){
        if(this._owner)this._owner.active = value;
    },
    setZhuang : function(value){
        if(this._zhuang)this._zhuang.active = value;
    },
    addScore : function(value,callback){
        if(value >= 0 && this._win){
            this._win.active = true;
            this._win.getComponent(cc.Label).string = "+" + value;
            this._win.y = 50;
            this._win.runAction(cc.sequence(cc.spawn(cc.scaleTo(0.3,1),cc.moveBy(0.3,cc.p(0,50))),cc.delayTime(2),cc.callFunc(callback)));
        }
        else if(value < 0 && this._lose){
            this._lose.active = true;
            this._lose.getComponent(cc.Label).string = "" + value;
            this._lose.y = 50;
            this._lose.runAction(cc.sequence(cc.spawn(cc.scaleTo(0.3,1),cc.moveBy(0.3,cc.p(0,50))),cc.delayTime(2),cc.callFunc(callback)));
        }
    },
    setScore : function(value){
        if(this._score)this._score.string = "" + value;
        if(this._win){
            this._win.active = false;
        }
        if(this._lose){
            this._lose.active = false;
        }
    },

    qiangzhuang : function(value){
        if(this._qiang){
            if(value){
                this._qiang.node.parent.active = true;
                this._qiang.spriteFrame = value;
            }
            else{
                this._qiang.node.parent.active = false;
            }
        }
    },
    setQiang : function(value){
        if(this._beishu){
            if(value){
                this._beishu.node.active = true;
                this._beishu.spriteFrame = value;
            }
            else{
                this._beishu.node.active = false;
            }
        }
    },
    setXiazhu : function(value){
        if(this._xiazhu){
            if(value){
                var node = this._xiazhu.node;
                node.active = true;
                this._xiazhu.spriteFrame = value;
                var pos = node.getPosition();
                node.x = 0;
                node.y = 0;
                node.scaleX = 0;
                node.scaleY = 0;
                node.runAction(cc.spawn(cc.moveTo(0.3,pos),cc.scaleTo(0.3,0.5)));
            }
            else{
                this._xiazhu.node.active = false;
            }
        }
    },

    chat : function(value,index){
        if(this._chatBubble){
            this._chatBubble.active = true;
            this._chatBubble.opacity = 255;
            this._chatBubble.stopAllActions();
            clearTimeout(this.emojiT);
            var chatbg = this._chatBubble.getChildByName("chatbg");
            var label = this._chatBubble.getChildByName("label").getComponent(cc.Label);
            var emoji = this._chatBubble.getChildByName("emoji").getComponent(cc.Sprite);
            label.node.active = true;
            emoji.node.active = false;
            chatbg.active = true;
            label.string = value;
            var baseGap = 40;
            var len = this.len_str(value);
            if(len < 24){
                chatbg.width = 16 * len + baseGap;
                if(index == 2 || index == 4){       //右边两家
                    label.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
                }
            }
            else{
                chatbg.width = label.node.width + baseGap;
                //还原左对齐
                if(index == 2 || index == 4){    
                    label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
                }
            }      
            chatbg.height = label.node.height + baseGap;

            this._chatBubble.runAction(cc.sequence(cc.delayTime(len * 0.12),cc.fadeOut(0.3)));
        }
    },
    emoji : function(value,index){
        if(this._chatBubble){
            this._chatBubble.active = true;
            this._chatBubble.opacity = 255;
            this._chatBubble.stopAllActions();          
            clearTimeout(this.emojiT);
            var chatbg = this._chatBubble.getChildByName("chatbg");
            var label = this._chatBubble.getChildByName("label").getComponent(cc.Label);
            var emoji = this._chatBubble.getChildByName("emoji").getComponent(cc.Animation);
            label.node.active = false;
            emoji.node.active = true;

            emoji.play(value);
            chatbg.active = false;
            /*emoji.sample(value);
            var baseGap = 40;
            if(index == 0 || index == 5){       //上下两家
                baseGap = 20;
            }
            chatbg.width = emoji.node.width * 0.8 + baseGap;
            chatbg.height = emoji.node.height * 0.8 + baseGap;*/
            
            var self = this;
            this.emojiT = setTimeout(function(){
                emoji.stop();
                self._chatBubble.runAction(cc.fadeOut(0.3));
            },2000);        
        }
    },

    voiceMsg : function(content){
        var time = content.time/1000;
        if(this._voicemsg){
            this._voicemsg.active = true;
            this._voicemsg.runAction(cc.sequence(cc.fadeIn(0.1),cc.delayTime(time),cc.fadeOut(0.1)));
        }
    },

    magic : function(content){
        if(this._magic){
            cc.vv.audioMgr.playSFX(content + ".mp3","chat");
            var anim = this._magic.getComponent(cc.Animation);
            anim.stop();
            if(content == "shuitong"){
                anim.play();
                return;
            }
            anim.node.scaleX = 1;
            anim.play(content);
        }
    },

    len_str : function(str){
        var len = 0;  
        for (var i=0; i<str.length; i++) {  
            if (str.charCodeAt(i)>127 || str.charCodeAt(i)==94) {  
                len += 2;
            } else {  
                len ++;  
            }
        }  
        return len;
    }
});
