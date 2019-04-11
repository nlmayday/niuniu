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
#import "WXApi.h"
#import "WXApiManager.h"
#import<AVFoundation/AVFoundation.h>

@class RootViewController;
@interface AppController : NSObject <UIAccelerometerDelegate, UIAlertViewDelegate, UITextFieldDelegate,UIApplicationDelegate,WXApiDelegate,AVAudioPlayerDelegate>
{
    UIWindow *window;
    RootViewController *viewController;
    AVAudioPlayer *_audioPlayer;
}
@property (nonatomic,retain)AVAudioPlayer *audioPlayer;
- (void)onResp:(BaseResp *)resp;//微信收到的返回消息
+(void)setupAlertController;//没有装微信的提示
+(void)login;//js 调用的微信登录
+(void)Share:(NSString *)shareUrl shareTitle:(NSString *)shareTitle shareDesc:(NSString *)shareDesc;//分享到朋友
+(void)ShareIMG:(NSString *)path width:(NSNumber *)width height:(NSNumber *)height;//发送战绩
+(void)ShareUrl:(NSString *)shareUrl shareTitle:(NSString *)shareTitle shareDesc:(NSString *)shareDesc;//分享url
+(void)WXPayReq:(NSString *)url andcustom:(NSString *)custom;//支付接口 js调用
//jsb.reflection.callStaticMethod(this.IOS_SDK, "wxPayReq:number:money:goodName:custom:",number,money,goodName,custom);
@end

