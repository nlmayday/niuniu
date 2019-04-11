/****************************************************************************
 Copyright (c) 2010-2013 cocos2d-x.org
 Copyright (c) 2013-2014 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#import <UIKit/UIKit.h>
#import "cocos2d.h"

#import "AppController.h"
#import "AppDelegate.h"
#import "RootViewController.h"
#import "platform/ios/CCEAGLView-ios.h"
#import "WXApi.h"
#import "WXApiManager.h"
#import "ScriptingCore.h"
#import <TABTSDK/TABTSDK.h>
#import "ViewController.h"


static bool isShare = false;
@implementation AppController

#pragma mark -
#pragma mark Application lifecycle

// cocos2d application instance
static AppDelegate s_sharedApplication;


#pragma mark - AVAudioPlayerDelegate

// 音频播放完成时
- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag{
    // 音频播放完成时，调用该方法。
    // 参数flag：如果音频播放无法解码时，该参数为NO。
    //当音频被终端时，该方法不被调用。而会调用audioPlayerBeginInterruption方法
    // 和audioPlayerEndInterruption方法
    
}

// 解码错误
- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error{
    NSLog(@"解码错误！");
    
    
}

// 当音频播放过程中被中断时
- (void)audioPlayerBeginInterruption:(AVAudioPlayer *)player{
    // 当音频播放过程中被中断时，执行该方法。比如：播放音频时，电话来了！
    // 这时候，音频播放将会被暂停。
}

// 当中断结束时
- (void)audioPlayerEndInterruption:(AVAudioPlayer *)player withOptions:(NSUInteger)flags{
    
    // AVAudioSessionInterruptionFlags_ShouldResume 表示被中断的音频可以恢复播放了。
    // 该标识在iOS 6.0 被废除。需要用flags参数，来表示视频的状态。
    
    NSLog(@"中断结束，恢复播放");
    if (flags == AVAudioSessionInterruptionFlags_ShouldResume || player != nil){
        [player play];
    }
    
}

+(void)login
{
    if ([WXApi isWXAppInstalled]) {
    //构造SendAuthReq结构体
    SendAuthReq* req =[[SendAuthReq alloc ] init ] ;
    req.scope = @"snsapi_userinfo" ;
    req.state = @"ld_wxLogin";//用于在OnResp中判断是哪个应用向微信发起的授权，这里填写的会在OnResp里面被微信返回
    //第三方向微信终端发送一个SendAuthReq消息结构
        [WXApi sendReq:req];
    }
    else {
        [self setupAlertController];
    }
}
#pragma mark - 设置弹出提示语
+(void)setupAlertController {
    
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"温馨提示" message:@"请先安装微信客户端" preferredStyle:UIAlertControllerStyleAlert];
    UIAlertAction *actionConfirm = [UIAlertAction actionWithTitle:@"确定" style:UIAlertActionStyleDefault handler:nil];
    [alert addAction:actionConfirm];
    [self presentViewController:alert animated:YES completion:nil];
}


+(void)Share:(NSString *)shareUrl shareTitle:(NSString *)shareTitle shareDesc:(NSString *)shareDesc
{
    //请求
    SendMessageToWXReq* req = [[SendMessageToWXReq alloc] init];
    
    WXMediaMessage *message = [WXMediaMessage message];
    //标题
    message.title = shareTitle;
    //描述
    message.description = shareDesc;
    
    //缩略图
    NSDictionary *infoPlist = [[NSBundle mainBundle] infoDictionary];
    NSString *icon = [[infoPlist valueForKeyPath:@"CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles"] lastObject];
    UIImage *shareImage = [UIImage imageNamed:icon];
    [message setThumbImage:shareImage];
    
    // bool isShare = true;
    // bool isLogin = false;
    NSLog(@"cocos2d oc share start" );
    //连接地址
    WXWebpageObject *webObject = [WXWebpageObject object];
    webObject.webpageUrl = shareUrl;
    message.mediaObject = webObject;
    
    req.bText = NO;
    req.message = message;
    req.scene = WXSceneSession;
    
    [WXApi sendReq:req];
}
+(void)ShareUrl:(NSString *)shareUrl shareTitle:(NSString *)shareTitle shareDesc:(NSString *)shareDesc
{
    //创建发送对象实例
    isShare = true;
     SendMessageToWXReq *sendReq = [[SendMessageToWXReq alloc] init];
     sendReq.bText = NO;//不使用文本信息
     sendReq.scene = 1;//0 = 好友列表 1 = 朋友圈 2 = 收藏
     
     //创建分享内容对象
     WXMediaMessage *urlMessage = [WXMediaMessage message];
     urlMessage.title = shareTitle;//@"多乐汇棋牌(最好玩，最刺激，最专业的地方棋牌)";//分享标题
     urlMessage.description = shareDesc;//分享描述
    //缩略图
    NSDictionary *infoPlist = [[NSBundle mainBundle] infoDictionary];
    NSString *icon = [[infoPlist valueForKeyPath:@"CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles"] lastObject];
    UIImage *shareImage = [UIImage imageNamed:icon];
    [urlMessage setThumbImage:shareImage];
     //创建多媒体对象
     WXWebpageObject *webObj = [WXWebpageObject object];
     webObj.webpageUrl = shareUrl;//分享链接
     
     //完成发送对象实例
     urlMessage.mediaObject = webObj;
     sendReq.message = urlMessage;
     sendReq.scene = WXSceneTimeline;
     //发送分享信息
     [WXApi sendReq:sendReq];
    
}
+(void)ShareIMG:(NSString *)path width:(NSNumber*)width height:(NSNumber*)height
{
    //创建发送对象实例
    
    WXMediaMessage * message = [WXMediaMessage message];
    //[message setThumbImage:[UIImage imageNamed:@"seeall@1x"]];
    
    WXImageObject * imageObject = [WXImageObject object];
    //NSString * filePath = [[NSBundle mainBundle] pathForResource:@"seeall@1x" ofType:@"png"];
    imageObject.imageData = [NSData dataWithContentsOfFile:path];
    message.mediaObject = imageObject;
    
    SendMessageToWXReq * req = [[SendMessageToWXReq alloc] init];
    req.bText = NO;
    req.message = message;
    req.scene = WXSceneTimeline;
    [WXApi sendReq:req];
}
//调用支付接口
+(void)WXPayReq:(NSString *)url andcustom:(NSString *)custom
{
    NSString *iTunesLink;
    iTunesLink = url;
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:iTunesLink]];
    //[[UIApplication sharedApplication]openURL:[NSURL RLWithString:@"http://www.baidu.com"]];
    //NSURLRequest * request = [NSURLRequest requestWithUrl:[NSURL urlWithString:url]];
}


//微信代理方法
- (void)onResp:(BaseResp *)resp
{
    
    int reslutl = 0;
    NSLog([NSString stringWithFormat:@"WXEntryActivity.onResp resp.errCode[%d]", resp.errCode]);
    NSLog(@"回调处理");
    
    // 处理 分享请求 回调
    if ([resp isKindOfClass:[SendMessageToWXResp class]]) {
        switch (resp.errCode) {
            case WXSuccess:
            {
                
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"提示"
                                                                message:@"分享成功!"
                                                               delegate:self
                                                      cancelButtonTitle:@"OK"
                                                      otherButtonTitles:nil, nil];
                [alert show];
                if(isShare)
                {
                    isShare = false;
                    //Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onShareResp('"+ 0 +"')");
                    NSString *jsCallStr = [NSString stringWithFormat:@"%@",@"cc.vv.anysdkMgr.onShareResp"];                NSLog(@"jsCallStr = %@", jsCallStr);
                    std::string jsca =  "cc.vv.anysdkMgr.onShareResp()";//[jsCallStr cStringUsingEncoding:NSUTF8StringEncoding];
                    ScriptingCore::getInstance()->evalString(jsca.c_str());
                }
            }
            break;
            
            default:
            {
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"提示"
                                                                message:@"分享失败!"
                                                               delegate:self
                                                      cancelButtonTitle:@"OK"
                                                      otherButtonTitles:nil, nil];
                [alert show];
            }
            break;
        }
        
    }
    
    // 处理 登录授权请求 回调
    else if ([resp isKindOfClass:[SendAuthResp class]]) {
        switch (resp.errCode) {
            case WXSuccess:
            {
                // 返回成功，获取Code
                SendAuthResp *sendResp = resp;
                NSString *code = sendResp.code;
                NSLog(@"code=%@",sendResp.code);
                // 根据Code获取AccessToken(有限期2个小时）
                // https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
                //
                
                NSLog(@"callJsEngineCallBack...");
                
                //std::string jsCallStr = cocos2d::StringUtils::format("%s(%s);",@"cc.vv.anysdkMgr.onLoginResp", code);
                NSString *jsCallStr = [NSString stringWithFormat:@"%@(\"%@\")",@"cc.vv.anysdkMgr.onLoginResp", code];                NSLog(@"jsCallStr = %@", jsCallStr);
                std::string jsca =  [jsCallStr cStringUsingEncoding:NSUTF8StringEncoding];
                ScriptingCore::getInstance()->evalString(jsca.c_str());
            
            }
            break;
            
            default:
            {
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"提示"
                                                                message:@"微信授权失败!"
                                                               delegate:self
                                                      cancelButtonTitle:@"OK"
                                                      otherButtonTitles:nil, nil];
                [alert show];
            }
            break;
        }
        
    }
}


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{

    // Override point for customization after application launch.

    // Add the view controller's view to the window and display.
    window = [[UIWindow alloc] initWithFrame: [[UIScreen mainScreen] bounds]];
    CCEAGLView *eaglView = [CCEAGLView viewWithFrame: [window bounds]
                                     pixelFormat: kEAGLColorFormatRGBA8
                                     depthFormat: GL_DEPTH24_STENCIL8_OES
                              preserveBackbuffer: NO
                                      sharegroup: nil
                                   multiSampling: NO
                                 numberOfSamples: 0 ];

    [eaglView setMultipleTouchEnabled:YES];
    
    
    // Use RootViewController manage CCEAGLView
    viewController = [[RootViewController alloc] initWithNibName:nil bundle:nil];
    viewController.wantsFullScreenLayout = YES;
    viewController.view = eaglView;

    // Set RootViewController to window
    if ( [[UIDevice currentDevice].systemVersion floatValue] < 6.0)
    {
        // warning: addSubView doesn't work on iOS6
        [window addSubview: viewController.view];
    }
    else
    {
        // use this method on ios6
        [window setRootViewController:viewController];
    }
    
    [window makeKeyAndVisible];

    [[UIApplication sharedApplication] setStatusBarHidden: YES];
    
 
    // IMPORTANT: Setting the GLView should be done after creating the RootViewController
    cocos2d::GLView *glview = cocos2d::GLViewImpl::createWithEAGLView(eaglView);
    cocos2d::Director::getInstance()->setOpenGLView(glview);
    //[[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:nil];
   
    
    
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setActive:YES error:nil];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:NULL];
    
    
    NSError *audioError = nil;
         BOOL success = [audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&audioError];
         if(!success)
             {
                     NSLog(@"error doing outputaudioportoverride - %@", [audioError localizedDescription]);
             }
   // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleInterruption:) name:AVAudioSessionInterruptionNotification object:[AVAudioSession sharedInstance]];
    cocos2d::Application::getInstance()->run();
    [WXApi registerApp:@"wx9433d5360ea51ce3"];
    //return [WXApi handleOpenURL:@"leduodcmj” delegate:self];
    
    return YES;
}

- (BOOL)application:(UIApplication *)application handleOpenURL:(NSURL *)url {
     AppController *ccontroller =[[AppController alloc] init];
    return  [WXApi handleOpenURL:url delegate:ccontroller];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
    AppController *ccontroller =[[AppController alloc] init];
    return [WXApi handleOpenURL:url delegate:ccontroller];
}

- (void)applicationWillResignActive:(UIApplication *)application {
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
    cocos2d::Director::getInstance()->pause();
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
    // background audio *must* mix with other sessions (or setActive will fail)
    /*
    NSError *sessionError = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                     withOptions:AVAudioSessionCategoryOptionMixWithOthers | AVAudioSessionCategoryOptionDuckOthers
                                           error:&sessionError];
    if (sessionError) {
        NSLog(@"ERROR: setCategory %@", [sessionError localizedDescription]);
    }
     */
    cocos2d::Director::getInstance()->resume();
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
     If your application supports background execution, called instead of applicationWillTerminate: when the user quits.
     */
    cocos2d::Application::getInstance()->applicationDidEnterBackground();
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    /*
     Called as part of  transition from the background to the inactive state: here you can undo many of the changes made on entering the background.
     */
    // background audio *must* mix with other sessions (or setActive will fail)
    /*
    NSError *sessionError = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                     withOptions:AVAudioSessionCategoryOptionMixWithOthers | AVAudioSessionCategoryOptionDuckOthers
                                           error:&sessionError];
    if (sessionError) {
        NSLog(@"ERROR: setCategory %@", [sessionError localizedDescription]);
    }
     */
    cocos2d::Application::getInstance()->applicationWillEnterForeground();
}

- (void)applicationWillTerminate:(UIApplication *)application {
    /*
     Called when the application is about to terminate.
     See also applicationDidEnterBackground:.
     */
}


#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    /*
     Free up as much memory as possible by purging cached data objects that can be recreated (or reloaded from disk) later.
     */
     cocos2d::Director::getInstance()->purgeCachedData();
}


- (void)dealloc {
    [super dealloc];
}


@end

