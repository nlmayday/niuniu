//
//  WXApiResponseManager.m
//  SDKSample
//
//  Created by Jeason on 15/7/14.
//
//

#import "WXApi.h"
#import "WXApiResponseHandler.h"

@implementation WXApiResponseHandler

#pragma mark - Public Methods
+ (BOOL)respText:(NSString *)text {
    GetMessageFromWXResp *resp = [GetMessageFromWXResp responseWithText:text
                                                        OrMediaMessage:nil
                                                                 bText:YES];
    return [WXApi sendResp:resp];
}

+ (BOOL)respImageData:(NSData *)imageData
           MessageExt:(NSString *)messageExt
               Action:(NSString *)action
           ThumbImage:(UIImage *)thumbImage {
    WXImageObject *ext = [WXImageObject object];
    ext.imageData = imageData;
    
    WXMediaMessage *message = [WXMediaMessage messageWithTitle:nil
                                                   Description:nil
                                                        Object:ext
                                                    MessageExt:messageExt
                                                 MessageAction:action
                                                    ThumbImage:thumbImage
                                                      MediaTag:nil];
    
    GetMessageFromWXResp* resp = [GetMessageFromWXResp responseWithText:nil
                                                         OrMediaMessage:message
                                                                  bText:NO];
    
    return [WXApi sendResp:resp];
}

+ (BOOL)respLinkURL:(NSString *)urlString
              Title:(NSString *)title
        Description:(NSString *)description
         ThumbImage:(UIImage *)thumbImage {
    WXWebpageObject *ext = [WXWebpageObject object];
    ext.webpageUrl = urlString;
    
    WXMediaMessage *message = [WXMediaMessage messageWithTitle:title
                                                   Description:description
                                                        Object:ext
                                                    MessageExt:nil
                                                 MessageAction:nil
                                                    ThumbImage:thumbImage
                                                      MediaTag:nil];
    
    GetMessageFromWXResp* resp = [GetMessageFromWXResp responseWithText:nil
                                                   OrMediaMessage:message
                                                            bText:NO];
    return [WXApi sendResp:resp];
}

+ (BOOL)respMusicURL:(NSString *)musicURL
             dataURL:(NSString *)dataURL
               Title:(NSString *)title
         Description:(NSString *)description
          ThumbImage:(UIImage *)thumbImage {
    WXMediaMessage *message = [WXMediaMessage message];
    message.title = title;
    message.description = description;
    [message setThumbImage:thumbImage];
    WXMusicObject *ext = [WXMusicObject object];
    ext.musicUrl = musicURL;
    ext.musicDataUrl = dataURL;
    
    message.mediaObject = ext;
    
    GetMessageFromWXResp* resp = [GetMessageFromWXResp responseWithText:nil
                                                   OrMediaMessage:message
                                                            bText:NO];
    
    return [WXApi sendResp:resp];
}

+ (BOOL)respVideoURL:(NSString *)videoURL
               Title:(NSString *)title
         Description:(NSString *)description
          ThumbImage:(UIImage *)thumbImage {
    WXVideoObject *ext = [WXVideoObject object];
    ext.videoUrl = videoURL;
    
    WXMediaMessage *message = [WXMediaMessage messageWithTitle:title
                                                   Description:description
                                                        Object:ext
                                                    MessageExt:nil
                                                 MessageAction:nil
                                                    ThumbImage:thumbImage
                                                      MediaTag:nil];
    
    GetMessageFromWXResp* resp = [GetMessageFromWXResp responseWithText:nil
                                                   OrMediaMessage:message
                                                            bText:NO];
    
    return [WXApi sendResp:resp];
}

+ (BOOL)respEmotionData:(NSData *)emotionData
             ThumbImage:(UIImage *)thumbImage {
    WXEmoticonObject *ext = [WXEmoticonObject object];
    ext.emoticonData = emotionData;

    WXMediaMessage *message = [WXMediaMessage messageWithTitle:nil
                                                   Description:nil
                                                        Object:ext
                                                    MessageExt:nil
                                                 MessageAction:nil
                                                    ThumbImage:thumbImage
                                                      MediaTag:nil];
    
    GetMessageFromWXResp* resp = [GetMessageFromWXResp responseWithText:nil
                                                   OrMediaMessage:message
                                                            bText:NO];
    return [WXApi sendResp:resp];
}

+ (BOOL)respFileData:(NSData *)fileData
       fileExtension:(NSString *)extension
               Title:(NSString *)title
         Description:(NSString *)description
          ThumbImage:(UIImage *)thumbImage {
    WXFileObject *ext = [WXFileObject object];
    ext.fileExtension = extension;
    ext.fileData = fileData;
    
    WXMediaMessage *message = [WXMediaMessage messageWithTitle:title
                                                   Description:description
                                                        Object:ext
                                                    MessageExt:nil
                                                 MessageAction:nil
                                                    ThumbImage:thumbImage
                                                      MediaTag:nil];
    
    GetMessageFromWXResp* resp = [GetMessageFromWXResp responseWithText:nil
                                                   OrMediaMessage:message
                                                            bText:NO];
    return [WXApi sendResp:resp];
}

+ (BOOL)respAppContentData:(NSData *)data
                   ExtInfo:(NSString *)info
                    ExtURL:(NSString *)url
                     Title:(NSString *)title
               Description:(NSString *)description
                MessageExt:(NSString *)messageExt
             MessageAction:(NSString *)action
                ThumbImage:(UIImage *)thumbImage {
    WXAppExtendObject *ext = [WXAppExtendObject object];
    ext.extInfo = info;
    ext.url = url;
    ext.fileData = data;
    
    WXMediaMessage *message = [WXMediaMessage messageWithTitle:title
                                                   Description:description
                                                        Object:ext
                                                    MessageExt:messageExt
                                                 MessageAction:action
                                                    ThumbImage:thumbImage
                                                      MediaTag:nil];
    
    GetMessageFromWXResp* resp = [GetMessageFromWXResp responseWithText:nil
                                                         OrMediaMessage:message
                                                                  bText:NO];

    return [WXApi sendResp:resp];
}

@end
