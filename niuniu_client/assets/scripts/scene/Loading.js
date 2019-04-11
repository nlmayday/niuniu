var HotUpdate = require("HotUpdate");
var version = "1.0.0";

cc.Class({
    extends: cc.Component,

    properties: {
        label: cc.Label,
        progressBar : cc.ProgressBar,

        manifestUrl: {
            default: null,
            url: cc.RawAsset
        },
    },

    // use this for initialization
    onLoad: function () {
        if(!cc.vv){
            cc.vv = {};
        }
        cc.vv.entrance = require("Entrance");
        cc.vv.utils = require("Utils");

        var log = require("Logs");
        log.setLevel(cc.vv.entrance.level);
        cc.vv.log = log.log;

        cc.vv.http = require("Http");
        cc.vv.http.init();

        var NetMgr = require("NetMgr");
        cc.vv.netMgr = new NetMgr();
        cc.vv.netMgr.onLoad();

        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();

        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.onLoad();

        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();

        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();

        cc.vv.headImgLoader = require("HeadImgLoader");
        
        this.getConfig(); 
    },
    
    versionCompare : function () {
        var versionA = cc.vv.versionA;
        if(versionA == undefined){
            return 0;
        }
        var versionB = cc.vv.mini_version;
        var vA = versionA.split('.');
        var vB = versionB.split('.');
        for (var i = 0; i < vA.length; ++i) {
            var a = parseInt(vA[i]);
            var b = parseInt(vB[i] || 0);
            if (a === b) {
                continue;
            }
            else {
                return a - b;
            }
        }
        if (vB.length > vA.length) {
            return -1;
        }
        else {
            return 0;
        }
    },

    getConfig:function(){
        var self = this;
        var received = false;
        var fnRequest = function(){
            if(received)return;
            cc.vv.http.sendRequest("/get_version",{version:version},function(ret){
                cc.vv.mini_version = ret.version;
                var hotUpdate = ret.hotUpdate;
                if(!hotUpdate)return;
                received = true;
                cc.vv.entrance.hotUpdate2 = hotUpdate.isHot;
                cc.vv.entrance.hotUrl = hotUpdate.hotUrl;
                self.checkUpdate();
            });
            setTimeout(fnRequest,5000);     
        }
        fnRequest();
    },
    
    onBtnDownloadClicked:function(){
        cc.vv.anysdkMgr.updateGame();
        cc.find("Canvas/alert").active = false;
    },
    
    checkUpdate: function () {
        var manifestUrl = this.manifestUrl;
        var hotUrl = cc.vv.entrance.hotUrl;
        var compared = false;
        var isLess = false;
        var self = this;
        var hotUpdate = new HotUpdate();
        var resultCB = function(result,desc){
            if(!compared){
                compared = true;
                if(self.versionCompare()<0){
                    isLess = true;
                    self.label.string = "低于服务器最低版本";
                } 
            };
            if(result === 0 && !isLess){
                console.log(result,desc);
                if(cc.vv.qianggeng){
                    cc.find("Canvas/alert").active = true;
                    self.label.node.active = false;
                    self.progressBar.node.active = false;
                    //self.onBtnDownloadClicked();
                }
                else{
                    hotUpdate.onDestroy();
                    hotUpdate = null;
                    self.gameLoad();
                }
            }
            else if(result === 1){
                self.label.string = desc;
            }
            else{
                cc.vv.log(3,desc);
            }
        };
        var progressCB = function(precent){
            precent = precent <= 0 ? 0 : (precent >= 1 ? 1 : precent)
            self.progressBar.progress = precent;
        };
        
        var showVersion = function(){
            self.node.getChildByName("versionA").getComponent(cc.Label).string = "版本号: " + cc.vv.versionA;
        };
        hotUpdate.init({
            manifestUrl:manifestUrl,
            hotUrl:hotUrl,
            resultCB:resultCB,
            progressCB:progressCB,
            showVersion:showVersion,
            reStart:true
        });
    },

    gameLoad : function(){
        this.label.string = "资源加载中";
        this.loadTime = 0;
    },

    update : function(dt){
        if(this.loadTime >= 0){
            this.progressBar.progress = this.loadTime;
            this.loadTime += dt / 2;
            if(this.loadTime >= 1){
                this.loadTime = -1;
                cc.director.loadScene("Login");
            }
        }
    }
    
});
