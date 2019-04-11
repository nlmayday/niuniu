(function () {
    // 在 main.js 的开头添加如下代码
    if (cc.sys.isNative) {
        var hotUpdateSearchPaths = cc.sys.localStorage.getItem('HotUpdateSearchPaths');
        var searchPaths = jsb.fileUtils.getSearchPaths();
        if (hotUpdateSearchPaths) {
            hotUpdateSearchPaths = JSON.parse(hotUpdateSearchPaths);
            searchPaths = hotUpdateSearchPaths.concat(searchPaths); 
        }
        jsb.fileUtils.setSearchPaths(searchPaths);
    }
    function boot () {

        var settings = window._CCSettings;
        window._CCSettings = undefined;

        if ( !settings.debug ) {
            // retrieve minified raw assets
            var rawAssets = settings.rawAssets;
            var assetTypes = settings.assetTypes;
            for (var mount in rawAssets) {
                var entries = rawAssets[mount];
                for (var uuid in entries) {
                    var entry = entries[uuid];
                    var type = entry[1];
                    if (typeof type === 'number') {
                        entry[1] = assetTypes[type];
                    }
                }
            }
        }

        // init engine
        var canvas;

        if (cc.sys.isBrowser) {
            canvas = document.getElementById('GameCanvas');
        }

        function setLoadingDisplay () {
            // Loading splash scene
            var splash = document.getElementById('splash');
            var progressBar = splash.querySelector('.progress-bar span');
            var currentResCount = cc.loader.getResCount();
            cc.loader.onProgress = function (completedCount, totalCount, item) {
                var percent = 100 * (completedCount - currentResCount) / (totalCount - currentResCount);
                if (progressBar) {
                    progressBar.style.width = percent.toFixed(2) + '%';
                }
            };
            splash.style.display = 'block';

            cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
                splash.style.display = 'none';
            });
        }

        var onStart = function () {
            cc.view.resizeWithBrowserSize(true);
            // UC browser on many android devices have performance issue with retina display
            if (cc.sys.os !== cc.sys.OS_ANDROID || cc.sys.browserType !== cc.sys.BROWSER_TYPE_UC) {
                cc.view.enableRetina(true);
            }
            //cc.view.setDesignResolutionSize(settings.designWidth, settings.designHeight, cc.ResolutionPolicy.SHOW_ALL);
            cc.view.enableAutoFullScreen(cc.sys.isMobile && cc.sys.browserType !== cc.sys.BROWSER_TYPE_BAIDU);
        
            if (cc.sys.isBrowser) {
                setLoadingDisplay();
            }

            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }

            // init assets
            cc.AssetLibrary.init({
                libraryPath: 'res/import',
                rawAssetsBase: 'res/raw-',
                rawAssets: settings.rawAssets,
                packedAssets: settings.packedAssets
            });

            var launchScene = settings.launchScene;

            console.log('main load scene: ' + launchScene);
            // load scene
            if (cc.runtime) {
                cc.director.setRuntimeLaunchScene(launchScene);
            }
            cc.director.loadScene(launchScene, null,
                function () {
                    if (cc.sys.isBrowser) {
                        // show canvas
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                    }

                    // play game
                    // cc.game.resume();

                    console.log('Success to load scene: ' + launchScene);
                }
            );
        };

        // jsList
        var jsList = settings.jsList;
        var bundledScript = settings.debug ? 'project.dev.js' : 'project.js';
        if (jsList) {
            jsList.push(bundledScript);
        }
        else {
            jsList = [bundledScript];
        }

        // anysdk scripts
        if (cc.sys.isNative && cc.sys.isMobile) {
            jsList = jsList.concat(['jsb_anysdk.js', 'jsb_anysdk_constants.js']);
        }

        jsList = jsList.map(function (x) { return 'src/' + x; });

        var option = {
            //width: width,
            //height: height,
            id: 'GameCanvas',
            scenes: settings.scenes,
            debugMode: settings.debug ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
            showFPS: settings.debug,
            frameRate: 60,
            jsList: jsList,
            groupList: settings.groupList,
            collisionMatrix: settings.collisionMatrix
        };

        cc.game.run(option, onStart);
    }

    if (cc.sys.isBrowser) {
        window.onload = boot;
    }
    else if (cc.sys.isNative) {
        require('src/settings.js');
        require('src/jsb_polyfill.js');

        boot();
    }

})();
