//'use strict';

exports.hash = function (content) {
	return CryptoJS.MD5(content);
}
exports.hmac = function (content, secret) {
    return CryptoJS.HmacMD5(content, secret);
}
exports.cipher = function(content, secret){     
    var keyStr = CryptoJS.enc.Utf8.parse(secret);
    var encryptedData = CryptoJS.AES.encrypt(content, keyStr, {  
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encryptedData.ciphertext.toString();
    
}
exports.decipher = function(content, secret){     
    var encryptedHexStr = CryptoJS.enc.Hex.parse(content);
    var encryptedBase64Str = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    var keyStr = CryptoJS.enc.Utf8.parse(secret);
    var plaintext = CryptoJS.AES.decrypt(encryptedBase64Str, keyStr, {  
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return plaintext.toString(CryptoJS.enc.Utf8);
}
exports.toBase64 = function(content){
    var wordArray = CryptoJS.enc.Utf8.parse(content);
    var base64 = CryptoJS.enc.Base64.stringify(wordArray);
	return base64;
}

exports.fromBase64 = function(content){
    var parsedWordArray = CryptoJS.enc.Base64.parse(content);
    var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
	return parsedStr;
}

exports.setClickEvent = function(node,target,component,handler){
    var eventHandler = new cc.Component.EventHandler();
    eventHandler.target = target;
    eventHandler.component = component;
    eventHandler.handler = handler;

    var clickEvents = node.getComponent(cc.Button).clickEvents;
    clickEvents[0] = eventHandler;
}
exports.addClickEvent = function(node,target,component,handler){
    var eventHandler = new cc.Component.EventHandler();
    eventHandler.target = target;
    eventHandler.component = component;
    eventHandler.handler = handler;

    var clickEvents = node.getComponent(cc.Button).clickEvents;
    clickEvents.push(eventHandler);
}
exports.addToggleEvent = function(node,target,component,handler){
    var eventHandler = new cc.Component.EventHandler();
    eventHandler.target = target;
    eventHandler.component = component;
    eventHandler.handler = handler;

    var clickEvents = node.getComponent(cc.Toggle).clickEvents;
    clickEvents.push(eventHandler);
}
exports.cutString = function(str,length){
    var ret = "";
    var len = 0;  
    for (var i=0; i<str.length; i++) {  
        if (str.charCodeAt(i)>127 || str.charCodeAt(i)==94) {  
            len += 2;
        } else {  
            len ++;  
        }
        if(len >= length){
            ret += "..";
            break;
        }
        ret += str[i];
    }  
    return ret;
}

exports.dateFormat  = function( format , date ) {
    if(date) {
        date = parseInt(date);
        date = new Date(date);
    }
    else {
        date = new Date();
    }
    format=format.replace(/y+/,"" + date.getFullYear());
    format=format.replace(/M+/,date.getMonth()>=9?""+(date.getMonth()+1):"0"+(date.getMonth()+1));
    format=format.replace(/d+/,"" + date.getDate()>=10?""+date.getDate():"0"+date.getDate());
    format=format.replace(/h+/,"" + date.getHours()>=10?""+date.getHours():"0"+date.getHours());
    format=format.replace(/m+/,"" + date.getMinutes()>=10?""+date.getMinutes():"0"+date.getMinutes());
    format=format.replace(/s+/,"" + date.getSeconds()>=10?""+date.getSeconds():"0"+date.getSeconds());
    format=format.replace(/q+/,"" + Math.floor(date.getMonth()/3 + 1));
    format=format.replace(/S+/,"" + date.getMilliseconds()>=10?""+date.getMilliseconds():"0"+date.getMilliseconds());
    
    return format;
}