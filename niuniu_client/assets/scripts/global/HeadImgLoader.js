cc.Class({
    statics : {
        loadsync : function(url, sex,sprite){
            cc.vv.headImgLoader.load(url,function(spriteFrame){
                sprite.spriteFrame = spriteFrame;
            },sex);
        },
        load : function(url, callback,sex){
            if(url == "" || url == null){
                var file = "head_girl";
                if(sex == 1){
                    file = "head_man";
                }
                //file += ".jpg";
                cc.loader.loadRes("textures/icon/"+ file, function(err, tex){
                    if( err ){
                        console.error(err);
                        callback(null);
                    }else{
                        var spriteFrame = new cc.SpriteFrame(tex,cc.Rect(0, 0, tex.width, tex.height));
                        if( spriteFrame ){
                            callback(spriteFrame);
                        }
                    }
                });
                return;
            }
            var filepath = url;
            var loadEnd = function(){
                console.log(filepath);
                cc.loader.load({url: filepath,type:"jpg"}, function(err, tex){
                    if( err ){
                        console.error(err);
                    }else{
                        var spriteFrame = new cc.SpriteFrame(tex,cc.Rect(0, 0, tex.width, tex.height));
                        if( spriteFrame ){
                            callback(spriteFrame);
                        }
                    }
                });
            }
            if(cc.sys.isNative){
                var dirpath =  jsb.fileUtils.getWritablePath() + 'headImg/';
                filepath = dirpath + cc.vv.utils.hash(url) + '.jpg';
            
                if( jsb.fileUtils.isFileExist(filepath) ){
                    console.log('Remote is find' + filepath);
                    loadEnd();
                    return;
                }
            
                var saveFile = function(data){
                    if(data){
                        if( !jsb.fileUtils.isDirectoryExist(dirpath) ){
                            jsb.fileUtils.createDirectory(dirpath);
                        }
                        if( jsb.fileUtils.writeDataToFile(  new Uint8Array(data) , filepath) ){
                            console.log('Remote write file succeed.');
                            loadEnd();
                        }else{
                            console.log('Remote write file failed.');
                        }
                    }else{
                        console.log('Remote download file failed.');
                    }
                };
                
                var xhr = new XMLHttpRequest();
                xhr.timeout = 3000;
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 ) {
                        if(xhr.status === 200){
                            xhr.responseType = 'arraybuffer';
                            saveFile(xhr.response);
                        }else{
                            saveFile(null);
                        }
                    }
                }.bind(this);
                xhr.ontimeout = function() {
                    console.log("HeadImgLoader timeout");
                    callback();
                };
                xhr.onerror = function() {
                    console.log("HeadImgLoader error");
                    callback();
                };
                xhr.open("GET", url, true);
                xhr.send();
            }
            else{
                loadEnd();
            } 
        }
    }
});
