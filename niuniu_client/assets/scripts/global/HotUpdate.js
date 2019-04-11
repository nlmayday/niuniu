cc.Class({
    properties: {
        _updating: false,
        _canRetry: false,    
    },

    init : function(param){
        this.manifestUrl = param.manifestUrl;
        this.hotUrl = param.hotUrl;
        this.resultCB = param.resultCB;
        this.progressCB = param.progressCB;
        this.reStart = param.reStart;
        this.showVersion = param.showVersion;
        
        this.onLoad();
    },

    onLoad: function () {
        if (!cc.sys.isNative || !cc.vv.entrance.hotUpdate || !cc.vv.entrance.hotUpdate2) {
            this.resultCB(0,"跳过热更新");
            return;
        }
        var storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'hot');

        var versionCompareHandle = function (versionA, versionB) {
            console.log("version A is " + versionA + ', version B is ' + versionB);
            cc.vv.versionA = versionA;
            cc.vv.versionB = versionB;
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                }
                else {
                    if(i !== vA.length - 1 && a < b){
                        cc.vv.qianggeng = true;
                        return 0;
                    }
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager(""/*this.hotUrl*/, storagePath, versionCompareHandle);
        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                cc.log("Verification passed : " + relativePath);
                return true;
            }
            else {
                cc.log("Verification passed : " + relativePath + ' (' + expectedMD5 + ')');
                return true;
            }
        });


        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
        }
        this.checkUpdate();
    },

    checkUpdate: function () {
        if (this._updating) {
            console.log("检查更新...");
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._am.loadLocalManifest(this.manifestUrl);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            cc.vv.log(6,"加载 manifest 文件失败...");
            return;
        }
        cc.client_version = this._am.getLocalManifest().getVersion();
        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);

        this._am.checkUpdate();
        this._updating = true;
    },

    checkCb: function (event) {
        cc.vv.log(6,'Code: ' + event.getEventCode());
        //this.lblErr.string += "checkCB :" + event.getEventCode() + " \n";
        var needUpdate = false;
        var desc = "";
        this.showVersion();
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                cc.log("No local manifest file found, hot update skipped.");
                desc = "本地更新文件丢失";
                this.resultCB(2,desc);
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                cc.log("Fail to download manifest file, hot update skipped.");
                desc = "下载更新文件失败";
                this.resultCB(2,desc);
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                cc.log("Already up to date with the latest remote version.");
                desc = "游戏不需要更新";
                this.resultCB(0,desc);
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                desc = "发现新版本";
                this.progressCB(0);
                this.resultCB(1,desc);
                needUpdate = true;
                break;
            default:
                return;
        }
        
        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
        this._updating = false;
        if( needUpdate ) {
            this.hotUpdate();
        }
    },

    hotUpdate: function () {
        if (this._am && !this._updating) {
            cc.log("开始更新游戏资源...");
            
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                this._am.loadLocalManifest(this.manifestUrl);
            }

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
        else {
            cc.log("更新游戏资源失败");
        }
    },

    updateCb: function (event) {
        cc.vv.log(6,'updateCB Code: ' + event.getEventCode());
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                cc.vv.log(6,"没有本地版本文件，忽略热更新\n");
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                var percent = event.getPercent();
                var percentByFile = event.getPercentByFile();
                var msg = event.getMessage();
                if (msg) {
                    cc.log(msg);
                }
                var desc = "资源更新中 " + parseInt(percent * 100) + "/100";
                this.resultCB(1,desc);
                this.progressCB(percent);
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                cc.log("下载失败，忽略热更新");
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                cc.log("资源已经是最新的");
                cc.eventManager.removeListener(this._updateListener);
            	this._updateListener = null;
            	this._updating = false;
                return;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                cc.log("更新游戏资源完成 :" + event.getMessage() + " \n");
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                cc.log("更新游戏资源失败 :" + event.getMessage() + " \n");
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                cc.log("更新失败:"+ event.getAssetId() + ', ' + event.getMessage());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                cc.log("解压失败" + event.getMessage());
                break;
            default:
                cc.log('updateCb.default ' + event.getMessage());
                break;
        }

        if (failed) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            if(this.reStart){
                cc.eventManager.removeListener(this._updateListener);
                this._updateListener = null;
                // Prepend the manifest's search path
                var searchPaths = jsb.fileUtils.getSearchPaths();
                var newPaths = this._am.getLocalManifest().getSearchPaths();
                
                Array.prototype.unshift(searchPaths, newPaths);
                console.log(JSON.stringify(newPaths),JSON.stringify(searchPaths));
                // This value will be retrieved and appended to the default search path during game startup,
                // please refer to samples/js-tests/main.js for detailed usage.
                // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
                cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));

                cc.log("游戏资源 更新完毕.");
                cc.audioEngine.stopAll();
                cc.game.restart();
            }
            else{
                this.resultCB(0,"更新游戏资源完成");
            }
        }
    },
    
    retry: function () {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;
            
            cc.log("Retry failed Assets...");
            this._am.downloadFailedAssets();
        }
    },

    onDestroy: function () {
        if (this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }
        if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.release();
        }
    }
});
