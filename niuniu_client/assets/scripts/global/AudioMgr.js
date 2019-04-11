cc.Class({
    properties: {
        yinyue : true,
        yinxiao : true,
        zhendong : true,
    },

    // use this for initialization
    onLoad: function () {
        this.yinyue = cc.sys.localStorage.getItem("yinyue") == 0?false:true;
        this.yinxiao = cc.sys.localStorage.getItem("yinxiao") == 0?false:true;
        this.zhendong = cc.sys.localStorage.getItem("zhendong") == 0?false:true;

        /*cc.game.on(cc.game.EVENT_HIDE, function () {
            //cc.audioEngine.pauseAll();
            cc.audioEngine.stopAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            //cc.audioEngine.resumeAll();
        });*/
    },
    setYinyue : function(value){
        this.yinyue = value;
        if(this.bgmAudioID >= 0){
            if(value){
               // cc.audioEngine.resume(this.bgmAudioID);
               cc.vv.audioMgr.playBGM("bgm0.mp3");
            }
            else{
                //cc.audioEngine.pause(this.bgmAudioID);
                cc.audioEngine.stop(this.bgmAudioID);
            }
        }
        else if(this.bgmAudioUrl && value){
            this.bgmAudioID = cc.audioEngine.play(this.bgmAudioUrl,true,1);
            this.bgmAudioUrl = null;
        }
    },
    setYinxiao : function(value){
        this.yinxiao = value;
    },
    setZhendong : function(value){
        this.zhendong = value;
        cc.vv.isFangyin = value;
    },
    getUrl:function(name,type,sex){
        var retUrl = "resources/sounds";
        if(type){
            retUrl += "/" + type;
        }
        if(sex == 1){
            retUrl += "/man";
            if(cc.vv.isFangyin){
                retUrl += "2";
            }
        }
        else if(sex == 2 || sex == 0){
            retUrl += "/woman";
            if(cc.vv.isFangyin){
                retUrl += "2";
            }
        }
        return cc.url.raw(retUrl + "/" + name);
    },
    
    playBGM(name,type){
        var audioUrl = this.getUrl(name,type);
        if(this.bgmAudioID >= 0){
            cc.audioEngine.stop(this.bgmAudioID);
            this.bgmAudioID = -1;
        }
        if(this.yinyue){
            this.bgmAudioID = cc.audioEngine.play(audioUrl,true,1);
        }
        else{
            this.bgmAudioUrl = audioUrl;
        }
    },
    
    playSFX(name,type,sex,isloop){
        var audioUrl = this.getUrl(name,type,sex);
        if(this.yinxiao){
            var loop = isloop?true:false;
            var audioId = cc.audioEngine.play(audioUrl,loop,1);
            return audioId;
        }
    },

    pauseAll:function(){
        cc.audioEngine.pauseAll();
    },
    
    resumeAll:function(){
        cc.audioEngine.resumeAll();
    }
});
