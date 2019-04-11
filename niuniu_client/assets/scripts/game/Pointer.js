cc.Class({
    properties: {
        _pointer:[],
        _timeLabel:null,
        _time:-1,
        _alertTime:-1,
        _audioId:-1,
    },

    // use this for initialization
    init: function (mjGame,root) {
        this.mjGame = mjGame;
        this._arrow = root;
        
        var pointer = root.getChildByName("pointer");
        var children = pointer.children;
        for(var i=0;i<children.length;i++){
            this._pointer.push(children[i]);
        }
        
        this._timeLabel = root.getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
    }, 
    
    initPointer:function(turn){
        this._arrow.active = this.mjGame.gameState == "playing";
        if(!this._arrow.active){
            return;
        }
        var localIndex = this.mjGame.getLocalIndex(turn);
        
        for(var i = 0; i < this._pointer.length; ++i){
            this._pointer[i].active = i == localIndex;
        }
        this._time = 15;
        this._alertTime = 3;
        this._timeLabel.string = "15";
        var self = this;
        var down = function(){
            if(self._time > 0){
                setTimeout(function(){
                    self.countDown();
                    down();
                },1000);
            }
        }
        down();
    },
    countDown:function(){
        if(this._time > 0){
            this._time --;
            if(this._alertTime > 0 && this._time <= this._alertTime){
                this._audioId = cc.vv.audioMgr.playSFX("timeup_alarm.mp3");
                this._alertTime = -1;
            }
            if(this._time <= 0){
                this._audioId = -1;
            }
            var pre = "";
            if(this._time < 10){
                pre = "0";
            }
            this._timeLabel.string = pre + this._time; 
        }
    
    },

    stop:function(){
        this._time = -1;
        this._alertTime = -1;
        if(this._audioId > 0){
            cc.audioEngine.stop(this._audioId);
            this._audioId = -1;
        }
    },
    
        
});
