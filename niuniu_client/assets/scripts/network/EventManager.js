
cc.Class({
    extends: cc.Component,
    
    properties: {
        eventQueue: [],         // 事件队列
    },
    onLoad: function(){
        
    },
    
    pushEvent: function(cmd, arg){
        var eventInfo = {
            cmd : 0,
            arg : 0,
        };
        eventInfo.cmd = cmd;
        eventInfo.arg = arg;
        this.eventQueue.push(eventInfo);
    },
    removeAllEvent: function(){
        this.eventQueue = [];
    },
    
    update : function(){
        while (this.eventQueue.length > 0){
            var cmd = this.eventQueue[0].cmd;
            var arg = this.eventQueue[0].arg;
            var _handler = cc.vv.netMgr.cmdHandlers.get(cmd);
            if(_handler === undefined||_handler === null){
                this.eventQueue.shift();
                cc.error('函数未注册',eventId);
                return;
            }
            _handler(arg);
            this.eventQueue.shift();
        }

        cc.vv.netMgr.update();
    },
 
});


