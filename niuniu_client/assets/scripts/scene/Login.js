cc.Class({
    extends: cc.Component,

    properties: {
    },

    // use this for initialization
    onLoad: function () {
        if(!cc.vv){
            cc.director.loadScene("Loading");
            return;
        }
        if(cc.vv.centerUrl == null){
            cc.vv.centerUrl = "http://" + cc.vv.entrance.url;
        }
        this.centerUrl = cc.vv.centerUrl;
        
        if(cc.vv.userMgr.area){
            this.area = cc.vv.userMgr.area;
        }
        this.servreList = this.node.getChildByName("ServerList");
        this.item = cc.find("Canvas/ServerList/layout/scrollView/view/content/item");
        this.servreList.active = false;
        this.item.active = false;
        this.sure = this.servreList.getChildByName("sure").getComponent(cc.Button);
        this.sure.interactable = false;

        this.loginBtn = this.node.getChildByName("login_wechat");
        this.loginBtn.active = false;

        this.editBox = cc.find("Canvas/ServerList/layout/editBox").getComponent(cc.EditBox);
        
        this.getServers();
        this.node.getChildByName("versionB").getComponent(cc.Label).string = "版本号: " + cc.vv.versionB;

        cc.audioEngine.stopAll();
    },
    getServers:function () {
        var self = this;
        cc.vv.http.url = this.centerUrl;
        cc.vv.http.sendRequest("/get_servers",{},function(ret){
            if(ret.errcode){
                console.log(ret.errcode);
                self.loginBtn.active = true;
                return;
            }
            for(var i = 0;i<ret.servers.length;i++){
                var data = ret.servers[i];
                if(data.desc == cc.vv.entrance.title){
                    self.index = data.index;
                    self.area = data.desc;
                }
            }
            self.getAddress();
        });
    },

    getAddress : function(){
        var index = this.index;
        
        cc.vv.http.url = this.centerUrl;
        var self = this;
        cc.vv.http.sendRequest("/get_address",{index:index},function(ret2){
            if(ret2.errcode){
                console.log(ret2.errcode);
                self.loginBtn.active = true;
                return;
            }
            cc.vv.http.serverIndex = ret2.index;
            cc.vv.http.serverToken = ret2.token;
            cc.vv.entrance.url = ret2.url;
            cc.vv.http.url = "http://" + ret2.url;
            cc.vv.http.gotLoginUrl = true;
            
            var account =  cc.sys.localStorage.getItem("account");
            var sign = cc.sys.localStorage.getItem("sign");
            if(account != null && sign != null){
                var ret = {
                    account:account,
                    sign:sign
                }
 
                cc.vv.userMgr.onAuth(ret);
            } 
            else
            {
                self.loginBtn.active = true;
            }
        });

    },
    onAreaClick : function(event){
        var data = event.target.servreData;
        this.index = data.index;
        this.area = data.desc;
        this.name = data.name;
        this.sure.interactable = true;
        if(this.selete == event.target){
            this.getAddress();
            this.servreList.active = false;
            cc.sys.localStorage.setItem("lastLoginServer",JSON.stringify(data));
            return;
        }
        if(this.selete){
            this.selete.getChildByName("mark").active = false;
        }
        this.selete = event.target;
        this.selete.getChildByName("mark").active = true;
    },
    onSureClick:function(){
        if(this.selete){
            this.getAddress();
            this.servreList.active = false;
            var data = this.selete.servreData;
            cc.sys.localStorage.setItem("lastLoginServer",JSON.stringify(data));
        }
    },
    onShowClick:function(){
        this.servreList.active = true;
    },
    onEditBox : function(){
        var str = this.editBox.string;
        var children = this.item.parent.children;
        for(var i = 0;i<children.length;i++){
            var data = children[i].servreData;
            if(data && (data.name == str || str == "")){
                children[i].active = true;
            }
            else{
                children[i].active = false;
            }
        }
    },
    onBtnVisitorClicked:function(){
        if(this.area){
            //cc.vv.entrance.name = this.name;
            cc.vv.entrance.title = this.area;
            cc.vv.userMgr.area = this.area;
            cc.vv.userMgr.guestAuth(); 
        }
    },
    onBtnWeichatClicked:function(){
        if(this.area){
            //cc.vv.entrance.name = this.name;
            cc.vv.entrance.title = this.area;
            cc.vv.userMgr.area = this.area;
            cc.vv.anysdkMgr.login();  //     cc.vv.userMgr.guestAuth(); 
        }
    },

    onToggleClicked : function(event){
        var isChecked = event.getComponent(cc.Toggle).isChecked;
        cc.log(isChecked);
        cc.find("Canvas/login_guest").getComponent(cc.Button).interactable = isChecked;
        cc.find("Canvas/login_wechat").getComponent(cc.Button).interactable = isChecked;
    },
    onBtnABClicked:function(event){
        if(this._mima == null){
            this._mima = ["A","B","A","A","B"];
        }
        if(this._mimaIndex == null){
            this._mimaIndex = 0;
        }
        if(this._mima[this._mimaIndex] == event.target.name){
            this._mimaIndex++;
            if(this._mimaIndex == this._mima.length){
                cc.find("Canvas/login_guest").active = true;
            }
        }
        else{
            console.log("oh ho~~~");
            this._mimaIndex = 0;
        }
    }
});
