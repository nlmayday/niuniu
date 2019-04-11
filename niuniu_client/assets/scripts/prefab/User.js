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

        var userName = this.getChild_safe(this.node,"userName/name");
        if(userName)this._userName = userName.getComponent(cc.Label);
        
        var userId = this.getChild_safe(this.node,"userId");
        if(userId)this._userId = userId.getComponent(cc.Label);

        var _sex1 = this.getChild_safe(this.node,"sex1");
        var _sex2 = this.getChild_safe(this.node,"sex2");

        var lv = this.getChild_safe(this.node,"lv");
        if(lv)this._lv = lv.getComponent(cc.Label);

        var ip = this.getChild_safe(this.node,"ip");
        if(ip)this._ip = ip.getComponent(cc.Label);
        
        var gems = this.getChild_safe(this.node,"gems/gems");
        if(gems)this._gems = gems.getComponent(cc.Label);

        var coins = this.getChild_safe(this.node,"coins/coins");
        if(coins)this._coins = coins.getComponent(cc.Label);

        var cards = this.getChild_safe(this.node,"cards/cards");
        if(cards)this._cards = cards.getComponent(cc.Label);

        var score = this.getChild_safe(this.node,"score");
        if(score)this._score = score.getComponent(cc.Label);

        this._chatBubble = this.getChild_safe(this.node,"ChatBubble");
        this._voicemsg = this.getChild_safe(this.node,"voicemsg");

        this._owner = this.getChild_safe(this.node,"owner");
        this._zhuang = this.getChild_safe(this.node,"zhuang");
        this._ready = this.getChild_safe(this.node,"ready");
        this._offline = this.getChild_safe(this.node,"offline");
        this.setOnline(true);
        this.setReady(false);
        this.setOwner(false);
        this.setZhuang(false);
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
            this._userId.string = "ID: " + this._userInfo.userId;            
        }        
        
        if(this._sex1)this._sex1.active = this._userInfo.sex == 1;
        if(this._sex2)this._sex2.active = this._userInfo.sex == 2;
        
        if(this._lv){
            this._lv.string = "LV." + this._userInfo.lv;
        }
        
        if(this._ip){
            this._ip.string = this._userInfo.ip; 
        }
        
        if(this._gems){
            this._gems.string = "" + this._userInfo.gems;    
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
        if(data.gems){
            this._gems.string = "" + data.gems;    
        }
        
        if(data.coins){
            this._coins.string = "" + data.coins;    
        }

        if(data.roomCard){
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
    setScore : function(value){
        if(this._score)this._score.string = "" + value;
    },
    tianTing : function(value){
        var node = this.node.getChildByName("tianTing");
        node.active = value;       
    },
    dingque : function(value){
        for(var i=0;i<3;i++){
            var name = "que" + i;
            var node = this.node.getChildByName(name);
            if(value == i){
                node.active = true;
            }
            else{
                node.active = false;
            }
        }
    },

    chat : function(value){
        if(this._chatBubble){
            this._chatBubble.active = true;
            this._chatBubble.opacity = 255;
            this._chatBubble.stopAllActions();
            
            var chatbg = this._chatBubble.getChildByName("chatbg");
            var label = this._chatBubble.getChildByName("label").getComponent(cc.Label);
            var emoji = this._chatBubble.getChildByName("emoji").getComponent(cc.Sprite);
            label.node.active = true;
            emoji.node.active = false;
            label.string = value;
            var len = this.len_str(value);
            if(len < 18){
                chatbg.width = 20*len + 40;
            }
            else{
                chatbg.width = label.node.width + 40;
            }      
            chatbg.height = label.node.height + 40;

            this._chatBubble.runAction(cc.sequence(cc.delayTime(2),cc.fadeOut(0.3)));
        }
    },
    emoji : function(value){
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
            chatbg.width = emoji.node.width + 40;
            chatbg.height = emoji.node.height + 40;

            emoji.play(value);
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
