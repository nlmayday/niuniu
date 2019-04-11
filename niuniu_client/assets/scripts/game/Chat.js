var _quickChatInfo = {};
_quickChatInfo["item0"] = {index:0,content:"伐好意思，刚接了个电话",sound:"ChatText_0.mp3"};
_quickChatInfo["item1"] = {index:1,content:"房间没满，房主再找几个嘛",sound:"ChatText_1.mp3"};
_quickChatInfo["item2"] = {index:2,content:"爆发吧我的小宇宙，这把我要通吃",sound:"ChatText_2.mp3"};
_quickChatInfo["item3"] = {index:3,content:"哥这桩一柱擎天，稳如泰山啊",sound:"ChatText_3.mp3"};
_quickChatInfo["item4"] = {index:4,content:"别磨蹭了，时间就是金钱",sound:"ChatText_4.mp3"};
_quickChatInfo["item5"] = {index:5,content:"哎哟我滴妈，手气有点旺哈哈",sound:"ChatText_5.mp3"};
_quickChatInfo["item6"] = {index:6,content:"把把都是赢，你咋不上天呐",sound:"ChatText_6.mp3"};
_quickChatInfo["item7"] = {index:7,content:"牛牛斗起来，气氛搞起来",sound:"ChatText_7.mp3"};
_quickChatInfo["item8"] = {index:7,content:"这...这牌，气得我手直抖",sound:"ChatText_8.mp3"};
_quickChatInfo["item9"] = {index:5,content:"又是没牛，今晚我要输得吐血",sound:"ChatText_9.mp3"};
_quickChatInfo["item10"] = {index:7,content:"四五六七八，嘿嘿，要的就是发",sound:"ChatText_10.mp3"};
_quickChatInfo["item11"] = {index:7,content:"放学别走，我要跟你再战三百回合",sound:"ChatText_11.mp3"};

function getQuickChatInfo(index){
    var key = "item" + (index-1);
    return _quickChatInfo[key];   
}
exports.getQuickChatInfo = getQuickChatInfo;

cc.Class({
    extends: cc.Component,

    properties: {
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _iptChat:null,
        
        _btnChat:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }

        this._tabQuick = this.node.getChildByName("quickchatlist");
        this._tabEmoji = this.node.getChildByName("emojis");
        
        this._iptChat = this._tabQuick.getChildByName("iptChat").getComponent(cc.EditBox);
    },
    
    onColseClicked:function(){
        var bg = this.node.getChildByName("bg");
        bg.active = false;
        var node = this.node;
        cc.vv.nnGame.node.canTouch = true;
        node.runAction(cc.sequence(cc.moveTo(0.15,cc.p(0,-500)),cc.callFunc(function(){
            bg.active = true;
            node.active = false;
        })));
    },
    
    onTabClicked:function(event){
        if(event.target.name == "tabQuick"){
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        }
        else if(event.target.name == "tabEmoji"){
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    onTabSelete:function(name){
        if(name== "tabQuick"){
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
            this.node.getChildByName("tabQuick").getComponent(cc.Toggle).isChecked = true;
            this.node.getChildByName("tabEmoji").getComponent(cc.Toggle).isChecked = false;
        }
        else if(name == "tabEmoji"){
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
            this.node.getChildByName("tabEmoji").getComponent(cc.Toggle).isChecked = true;
            this.node.getChildByName("tabQuick").getComponent(cc.Toggle).isChecked = false;
        }
    },
    
    onQuickChatItemClicked:function(event,data){
        this.node.active = false;
        var index = parseInt(data);
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.quick_chat,index);
    },
    
    onEmojiItemClicked:function(event){
        this.node.active = false;
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.emoji,event.target.name);
    },
    
    onBtnSendChatClicked:function(){
        if(this._iptChat.string == ""){
            return;
        }
        this.node.active = false;
        var info = cc.vv.utils.toBase64(this._iptChat.string);
        cc.vv.netMgr.doSend2(cc.vv.netMgr.req.chat,info);
        this._iptChat.string = "";
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
