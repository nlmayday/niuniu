var stream = require("Binstream");

function WebSocketConnection (){
    this.headerLength = 17;
    this.uri = "";
    this.websocket = null;
    this.onOpenCB = null;
    this.onCloseCB = null;
    this.onErrorCB = null;
    this.onMessageCB = null;
}

WebSocketConnection.prototype.connect = function(uri,onOpenCB,onCloseCB,onErrorCB,onMessageCB,noNeedClose) {
    if(this.websocket){
        if(noNeedClose != true){
            this.websocket.close();
        }
        this.websocket = null;
    }
    this.uri = uri;
    this.onOpenCB = onOpenCB;
    this.onCloseCB = onCloseCB;
    this.onErrorCB = onErrorCB;
    this.onMessageCB = onMessageCB;

    //var xnode = cc.director.getScene().getChildByName("Canvas");
    //cc.vv.prefabMgr.alertOpen(xnode,"提示","初始化网络1");

    this.websocket = new WebSocket(this.uri);

    //var xnode = cc.director.getScene().getChildByName("Canvas");
    //cc.vv.prefabMgr.alertOpen(xnode,"提示","初始化网络2" + this.uri);

    var self = this;
    this.websocket.onopen = function(event) {
        self.onOpen(event);
    }
    this.websocket.onclose = function(event) {
        self.onClose(event);
    }
    this.websocket.onerror = function(event) {
        self.onError(event);
    }
    this.websocket.onmessage = function(event) {
        self.onMessage(event);
    }
}
WebSocketConnection.prototype.close = function() {
    try{
        if(this.websocket){
            this.websocket.close();
        }
    }
    catch (e) {
        console.log("err:" + e);
    }
    this.websocket = null;
}
WebSocketConnection.prototype.onOpen = function(event) {
    if (this.onOpenCB) {
        this.onOpenCB(event);
    }
}

WebSocketConnection.prototype.onClose = function(event) {
    if (this.onCloseCB) {
        this.onCloseCB(event);
    }
}

WebSocketConnection.prototype.onError = function(event) {
    if (this.onErrorCB) {
        this.onErrorCB(event);
    }
}

WebSocketConnection.prototype.onMessage = function(event) {
    var data = event.data;
    if(cc.sys.isBrowser){
        var self = this;
        var reader = new FileReader();
        reader.readAsArrayBuffer(event.data);
        reader.onload = function (e) {
            data = reader.result;
            var uint8ArrayNew  = new Uint8Array(data);
            self.onParseBlob(uint8ArrayNew);
            return;
        }
    }
    var uint8ArrayNew  = new Uint8Array(data);
    this.onParseBlob(uint8ArrayNew);
}

WebSocketConnection.prototype.onParseBlob = function(parsedData) {
    if (parsedData.length >= this.headerLength) { // 读取头的长度
        var readStream = stream.ReadStream;
        readStream.init(parsedData);
        var head0 = readStream.uint8();
        var head1 = readStream.uint8();
        var head2 = readStream.uint8();
        var head3 = readStream.uint8();
        var protoVersion = readStream.uint8();
        var serverVersion = readStream.uint32();
        var length = readStream.uint32();
        length -= 4;
        var commandId = readStream.uint32();
        if (readStream.length() >= length + this.headerLength) {
            var msgContent = readStream.utf8(length);
            msgContent = JSON.parse(msgContent);
            //回调应用层处理消息
            if (this.onMessageCB) {
                this.onMessageCB(commandId, msgContent);
            }
        }
    }
}

WebSocketConnection.prototype.send = function(commandId, msgContent) {
    var jsonContent = JSON.stringify(msgContent);
    var sendData = this.buildData(commandId, jsonContent);
    if(this.websocket){
        try {
            this.websocket.send(sendData);
        } catch (error) {
            console.log(error);
        }
    }
    //console.log(jsonContent);
}

WebSocketConnection.prototype.buildData = function(commandId, msgContent) {
    // 将传递过来的内容附加上消息头组合成二进制数据发送给服务端
    // 协议头
    /**
    HEAD_0 = ord(ud[0])
    HEAD_1 = ord(ud[1])
    HEAD_2 = ord(ud[2])
    HEAD_3 = ord(ud[3])
    protoVersion = ord(ud[4])
    serverVersion = ud[5]
    length = ud[6] + 4
    command = ud[7]
    */
    var writeStream = stream.WriteStream;
    writeStream.init();
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint32(0);
    var length = msgContent.length + 4;
    writeStream.uint32(length);
    writeStream.uint32(commandId);
    writeStream.utf8(msgContent);
    return writeStream.bytes();
}

module.exports = WebSocketConnection;
