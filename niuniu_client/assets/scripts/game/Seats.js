cc.Class({
    properties: {
        seats : [],
    },

    // use this for initialization
    init: function (mjGame,node) {
        this.mjGame = mjGame;

        var child = node.children;
        for(var i = 0;i < child.length;i++){
            var user = child[i].getComponent("User");
            user.onLoad();
            this.seats.push(user);
            child[i].active = false;
        }
    },

    initSeats:function(seatDatas){
        for(var i = 0; i < seatDatas.length; ++i){
            this.initSingleSeat(seatDatas[i]);
        }
    },
    initSingleSeat:function(seatData){
        if(seatData.userId <= 0)return;
        var index = this.mjGame.getLocalIndex(seatData.userId);
        var isOwner = seatData.userId == this.mjGame.owner;
        this.seats[index].setUserInfo(seatData);
        this.seats[index].refresh();
        this.seats[index].setOwner(isOwner);
        this.setOnline(seatData);
        this.setReady(seatData);
        this.setScore(seatData);
        this.dingque(seatData.userId,seatData.que);
    },
    setPosition:function(posArr){
        for(var i = 0; i < posArr.length; ++i){
            this.seats[i].node.setPosition(posArr[i]);
        }
    },
    posMove:function(posArr){
        for(var i = 0; i < posArr.length; ++i){
            this.seats[i].node.runAction(cc.moveTo(0.5,posArr[i]).easing(cc.easeExponentialOut(3.0)));
        }
    },
    setOnline : function(data){
        var index = this.mjGame.getLocalIndex(data.userId);
        this.seats[index].setOnline(data.online);
    },
    setReady : function(data){
        var index = this.mjGame.getLocalIndex(data.userId);
        var ready = data.ready?true:false;
        this.seats[index].setReady(ready);
    },
    
    setZhuang : function(userId){
        var index = this.mjGame.getLocalIndex(userId);
        for(var i = 0; i < this.seats.length; ++i){
            if(i == index)this.seats[i].setZhuang(true);
            else this.seats[i].setZhuang(false);
        }
        
    },
    setScore : function(data){
        var index = this.mjGame.getLocalIndex(data.userId);
        this.seats[index].setScore(data.score);
    },

    exit : function(userId){
        var index = this.mjGame.getLocalIndex(userId);
        this.seats[index].node.active = false;
    },
    tianTing : function(userId,value){
        var index = this.mjGame.getLocalIndex(userId);
        this.seats[index].tianTing(value);
    },
    dingque : function(userId,que){
        var index = this.mjGame.getLocalIndex(userId);
        this.seats[index].dingque(que);
    },

    chat:function(userId,content){
        var index = this.mjGame.getLocalIndex(userId);
        this.seats[index].chat(content);
    },
    
    emoji:function(userId,content){
        var index = this.mjGame.getLocalIndex(userId);
        this.seats[index].emoji(content);
    },
    
    voiceMsg:function(userId,content){
        var index = this.mjGame.getLocalIndex(userId);
        this.seats[index].voiceMsg(content);
    },
});
