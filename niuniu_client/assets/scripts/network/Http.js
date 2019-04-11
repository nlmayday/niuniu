
var HTTP = cc.Class({
    statics:{
        url:"",
        shareWeb : "",
        serverIndex : 0,
        serverToken : "",
        gotLoginUrl : false,    
        sendRequest : function(path,data,handler,extraUrl){
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 5000;
            var str = "?";
            for(var k in data){
                if(str != "?"){
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            if(extraUrl == null){
                extraUrl = HTTP.url;
            }
            var requestURL = extraUrl + path + encodeURI(str);
            cc.vv.log(1,"RequestURL:" + requestURL);
            xhr.open("GET",requestURL, true);
            if (cc.sys.isNative){
                xhr.setRequestHeader("Accept-Encoding","gzip,deflate","text/html;charset=UTF-8");
            }
            
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4 && xhr.status === 200){
                    console.log("http res("+ xhr.responseText.length + "):" + xhr.responseText);
                    try {
                        var ret = JSON.parse(xhr.responseText);
                        if(typeof handler === "function"){
                            handler(ret);
                        }
                    } catch (e) {
                        console.log("err:" + e);
                        handler({errcode:13});
                    }//errcode：解析错误 13  超时 12  请求错误 11
                }
            };
            xhr.ontimeout = function() {
                console.log("http timeout");
                handler({errcode:12});
            };
            xhr.onerror = function() {
                console.log("http error");
                handler({errcode:11});
            };
            xhr.send();
            return xhr;
        },

        init : function(){
            HTTP.url = "http://" + cc.vv.entrance.url;
        }
    },
});