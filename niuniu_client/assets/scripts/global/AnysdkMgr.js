cc.Class({
    properties: {
    },

    // use this for initialization
    onLoad: function () {
    },
    
    init:function(){
        this.ANDROID_API = "com/game/sdk/Anysdk";
        this.IOS_API = "AppController";

        this.allowLogin = true;
        this.allowShare = true;
        this.allowShareResult = true;
    },
    
    login:function(){
        if(!this.allowLogin)return;
        this.allowLogin = false;
        var self = this;
        setTimeout(function(){
            self.allowLogin = true;
        },3000);
        if(cc.sys.os == cc.sys.OS_ANDROID){ 
            jsb.reflection.callStaticMethod(this.ANDROID_API, "login", "()V");
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(this.IOS_API, "login");
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement login.");
        }
    },
    
    share:function(url,title,desc,type){
        if(!this.allowShare)return;
        this.allowShare = false;
        var self = this;
        setTimeout(function(){
            self.allowShare = true;
        },3000);
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod(this.ANDROID_API, "share", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I)V",url,title,desc,type);
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(this.IOS_API, "share:title:desc:type:",url,title,desc,type);
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },
    
    saveShot:function(){
        if(!this.allowShareResult)return;
        this.allowShareResult = false;
        var self = this;
        setTimeout(function(){
            self.allowShareResult = true;
        },3000);
        if(!cc.sys.isNative){
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
            return;
        }
        var size = cc.director.getWinSize();
        var currentDate = new Date();
        var fileName = "" + currentDate.getFullYear()+"_"+(currentDate.getMonth()+1)+"_"
            +currentDate.getDate()+"_"+currentDate.getHours()+"_"+currentDate.getMinutes()+"_"
            +currentDate.getSeconds()+"_result_share.jpg";
        var fullPath = jsb.fileUtils.getWritablePath() + fileName;
        if(jsb.fileUtils.isFileExist(fullPath)){
            jsb.fileUtils.removeFile(fullPath);
        }
        var texture = new cc.RenderTexture(Math.floor(size.width), Math.floor(size.height));
        texture.setPosition(cc.p(size.width/2, size.height/2));
        texture.begin();
        cc.director.getRunningScene().visit();
        texture.end();
        console.log(fileName);
        texture.saveToFile(fileName, cc.ImageFormat.JPG);
        return fullPath;
    },

    shareResult:function(type){
        if(!this.allowShareResult)return;
        var fullPath = this.saveShot();
        var size = cc.director.getWinSize();
        var self = this;
        var tryTimes = 0;
        var fn = function(){
            if(!cc.sys.isNative)return;
            if(jsb.fileUtils.isFileExist(fullPath)){
                var height = 1280;
                var scale = height/size.height;
			    var width = Math.floor(size.width * scale);
                console.log("fullPath:"+fullPath+",width:"+width+",height:"+height);
                if(cc.sys.os == cc.sys.OS_ANDROID){
                    jsb.reflection.callStaticMethod(self.ANDROID_API, "shareIMG", "(Ljava/lang/String;I)V",fullPath,type);
                }
                else if(cc.sys.os == cc.sys.OS_IOS){
                    jsb.reflection.callStaticMethod(self.IOS_API, "shareIMG:width:height:",fullPath,width,height);
                }
                else{
                    console.log("platform:" + cc.sys.os + " dosn't implement share.");
                }
            }
            else{
                tryTimes++;
                if(tryTimes > 10){
                    console.log("time out...");
                    return;
                }
                setTimeout(fn,50); 
            }
        }
        setTimeout(fn,50);
    },
    
    onLoginResp:function(code){
        var fn = function(ret){
            if(ret.errcode == null){
                cc.sys.localStorage.setItem("account",ret.account);
                cc.sys.localStorage.setItem("sign",ret.sign);
                cc.vv.userMgr.onAuth(ret);
            }
        }
        cc.vv.http.sendRequest("/wechat_auth",{code:code,os:cc.sys.os,area:cc.vv.userMgr.area},fn);
    },

    setGetRoomIdHandle:function(handle){
        this.enterRoomHandle = handle;
    },
    setRoomId:function(roomId){
        if(this.enterRoomHandle){
            this.enterRoomHandle(roomId);
        }
    },
    getRoomId:function(){
        var roomId = 0;
        if(cc.sys.os == cc.sys.OS_ANDROID){
            roomId = jsb.reflection.callStaticMethod(this.ANDROID_API, "getRoomId", "()Ljava/lang/String;");
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            roomId = jsb.reflection.callStaticMethod(this.IOS_API, "getRoomId");
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement getRoomId.");
        }
        var id = parseInt(roomId);
        if(id >= 100000 && id <= 999999){
            return id;
        }
        else {
            return null;
        }
    },

    copyText : function(text){
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod(this.ANDROID_API, "copyText", "(Ljava/lang/String;)V",text);
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(this.IOS_API, "copyText:",text);
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement copyText.");
        }
    },

    updateGame : function(){
        var updateurl = "";
        var appName = cc.vv.entrance.name;
        if(cc.sys.os == cc.sys.OS_ANDROID){
            updateurl = "www.world2018.cn/" + cc.vv.entrance.title + "/" + cc.vv.entrance.title + ".apk";
            jsb.reflection.callStaticMethod(this.ANDROID_API, "updateGame", "(Ljava/lang/String;Ljava/lang/String;)V",updateurl,appName);
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            updateurl = "www.world2018.cn/" + cc.vv.entrance.title + "/index.htm";
            cc.sys.openURL(updateurl);//强更
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement updateGame.");
        }
    },

});