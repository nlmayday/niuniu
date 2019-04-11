cc.Class({
    properties: {
        account:null,
	    userId:null,
        userName:"",
        sex:0,          //普通用户性别，1为男性，2为女性
        headImg:"",
		lv:0,
        exp:0,
        gems:0,
		coins:0,
		roomCard:0,
        ip:"",
        address:"",
        oldRoomId:null,
        allBaseInfo : null,
    },
    
    urlParse:function(){
        var params = {};
        if(window.location == null){
            return params;
        }
        var name,value; 
        var str=window.location.href; //取得整个地址栏
        var num=str.indexOf("?") 
        str=str.substr(num+1); //取得所有参数

        var arr=str.split("&"); //各个参数放到数组里
        for(var i=0;i < arr.length;i++){ 
            num=arr[i].indexOf("="); 
            if(num>0){ 
                name=arr[i].substring(0,num);
                value=arr[i].substr(num+1);
                params[name]=value;
            } 
        }
        return params;
    },

    guestAuth:function(){
        var account = this.urlParse()["account"];
        if(account == null){
            account = cc.sys.localStorage.getItem("account");
        }
        
        if(account == null){
            account = Date.now();
            cc.sys.localStorage.setItem("account",account);
        }
        
        cc.vv.http.sendRequest("/guest",{account:account,area:cc.vv.userMgr.area},this.onAuth);
    },
    
    onAuth:function(ret){
        var self = cc.vv.userMgr;
        if(ret.errcode){
            console.log("guest errcode",ret.errcode);
        }
        else{
            self.account = ret.account;
            self.sign = ret.sign;
            self.login();
        }   
    },

    onLogin:function(ret){
        var self = cc.vv.userMgr;
        if(ret.errcode){
            console.log("login errcode",ret.errcode);
            if(ret.errcode == 207){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","黑名单用户禁止登录");
            }
        }
        else{
            if(ret.account != null)self.account = ret.account;
            if(ret.userId != null)self.userId = ret.userId;
            if(ret.userName != null)self.userName = cc.vv.utils.fromBase64(ret.userName);
            if(ret.sex != null)self.sex = ret.sex;
            if(ret.headImg != null)self.headImg = ret.headImg;
            if(ret.lv != null)self.lv = ret.lv;
            if(ret.exp != null)self.exp = ret.exp;
            if(ret.gems != null)self.gems = ret.gems;
            if(ret.coins != null)self.coins = ret.coins;
            if(ret.roomCard != null)self.roomCard = ret.roomCard;
            if(ret.ip != null)self.ip = ret.ip;
            if(ret.address != null)self.address = ret.address;
            if(ret.oldRoomId != null)self.oldRoomId = ret.oldRoomId;
            if(ret.records != null)self.records = ret.records;
            
            if(ret.area != null)self.area = ret.area;
            if(ret.unionId != null)self.unionId = ret.unionId;

            var server = ret.server;
            cc.vv.http.weChat = server.weChat;
            cc.vv.http.shareWeb = server.shareWeb;
            cc.vv.http.url = "http://" + server.url;

            cc.vv.netMgr.hallUrl = "ws://" + server.url;
            cc.vv.netMgr.wsUri = "ws://" + server.url;
            cc.vv.netMgr.initLink(function(){
                cc.director.loadScene("Hall");
            });
        }
    },

    login:function(){       //游客登陆和微信登录
        cc.vv.http.sendRequest("/login",{account:this.account,sign:this.sign,index:cc.vv.http.serverIndex,token:cc.vv.http.serverToken},this.onLogin);
    },
    
    auth:function(account,password){       //账号密码登陆
        cc.vv.http.sendRequest("/auth",{account:account,password:password,index:cc.vv.http.serverIndex,token:cc.vv.http.serverToken},this.onLogin);
    },

    enterRoom:function(roomId,callback){
        var onEnter = function(ret){
            if(callback != null){
                callback(ret);
            }
            if(ret.errcode){
                cc.vv.prefabMgr.waitClose();
                console.log("enterRoom errcode",ret.errcode);
            }
            else{
                cc.vv.netMgr.wsUri = "ws://" + ret.url;
                cc.vv.netMgr.initLink(function(){
                    cc.director.loadScene("NNGame",function(){
                        cc.vv.prefabMgr.waitClose();
                    });                  
                });
            }
        };
        
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.enter_private_room_resp,onEnter);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.enter_private_room,roomId);
    },
    enterRoom_public:function(callback){
        var onEnter = function(ret){
            if(callback != null){
                callback(ret);
            }
            if(ret.errcode){
                console.log("enterRoom errcode",ret.errcode);
            }
            else{
                cc.vv.netMgr.wsUri = "ws://" + ret.url;
                cc.vv.netMgr.initLink(function(){
                    cc.director.loadScene("NNGame");
                });
            }
        };
        //cc.vv.wc.show("正在进入房间 " + roomId);
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.enter_public_room_resp,onEnter);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.enter_public_room);
    },
    getUserBaseInfo:function(userId,callback,sprite,name){
        if(this.allBaseInfo == null)this.allBaseInfo = {};
        if(this.allBaseInfo[userId]){
            if(callback != null){
                callback(this.allBaseInfo[userId],sprite,name);
            } 
            return;
        }
        var self = this;
        var onGet = function(ret){  
            self.allBaseInfo[userId] = ret;
            if(callback != null){
                callback(ret,sprite,name);
            }     
        };
        cc.vv.http.sendRequest("/getUserBaseInfo",{userId:userId},onGet);
    },
    getHistoryList:function(callback){
        var onGet = function(ret){  
            if(callback != null){
                callback(ret);
            }     
        };
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.getHistoryList_resp,onGet);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.getHistoryList);
    },
    getGamesOfRoom:function(uuid,callback){
        var onGet = function(ret){  
            if(callback != null){
                callback(ret);
            }     
        };
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.getGamesOfRoom_resp,onGet);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.getGamesOfRoom);
    },
    
    getDetailOfGame:function(uuid,index,callback){
        var onGet = function(ret){  
            if(callback != null){
                callback(ret);
            }     
        };
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.getDetailOfGame_resp,onGet);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.getDetailOfGame);
    },

    getListOfShop:function(callback){
        var onGet = function(ret){  
            if(callback != null){
                callback(ret);
            }     
        };
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.getListOfShop_resp,onGet);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.getListOfShop);
    },

    getListOfPayRecords:function(page,callback){
        var onGet = function(ret){  
            if(callback != null){
                callback(ret);
            }     
        };
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.getListOfPayRecords_resp,onGet);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.getListOfPayRecords);
    },

    updateTaskState : function(taskId,state,callback){
        var onGet = function(ret){  
            if(callback != null){
                callback(ret);
            }     
        };
        cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.updateTaskState_resp,onGet);
        cc.vv.netMgr.doSend1(cc.vv.netMgr.req.updateTaskState);
    },
});
