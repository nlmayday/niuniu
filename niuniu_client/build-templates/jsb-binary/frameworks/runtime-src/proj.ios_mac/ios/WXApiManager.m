//
//  WXApiManager.m
//  SDKSample
//
//  Created by Jeason on 16/07/2015.
//
//

#import "WXApiManager.h"

@implementation WXApiManager

#pragma mark - LifeCycle
+(instancetype)sharedManager {
    static dispatch_once_t onceToken;
    static WXApiManager *instance;
    dispatch_once(&onceToken, ^{
        instance = [[WXApiManager alloc] init];
    });
    return instance;
}

#pragma mark - WXApiDelegate
- (void)onResp:(BaseResp *)resp {
    if ([resp isKindOfClass:[SendMessageToWXResp class]]) {
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvMessageResponse:)]) {
            SendMessageToWXResp *messageResp = (SendMessageToWXResp *)resp;
            [_delegate managerDidRecvMessageResponse:messageResp];
        }
    } else if ([resp isKindOfClass:[SendAuthResp class]]) {
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvAuthResponse:)]) {
            SendAuthResp *authResp = (SendAuthResp *)resp;
            [_delegate managerDidRecvAuthResponse:authResp];
        }
    } else if ([resp isKindOfClass:[AddCardToWXCardPackageResp class]]) {
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvAddCardResponse:)]) {
            AddCardToWXCardPackageResp *addCardResp = (AddCardToWXCardPackageResp *)resp;
            [_delegate managerDidRecvAddCardResponse:addCardResp];
        }
    } else if ([resp isKindOfClass:[WXChooseCardResp class]]) {
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvChooseCardResponse:)]) {
            WXChooseCardResp *chooseCardResp = (WXChooseCardResp *)resp;
            [_delegate managerDidRecvChooseCardResponse:chooseCardResp];
        }
    }else if ([resp isKindOfClass:[WXChooseInvoiceResp class]]){
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvChooseInvoiceResponse:)]) {
            WXChooseInvoiceResp *chooseInvoiceResp = (WXChooseInvoiceResp *)resp;
            [_delegate managerDidRecvChooseInvoiceResponse:chooseInvoiceResp];
        }
    }else if ([resp isKindOfClass:[WXSubscribeMsgResp class]]){
        if ([_delegate respondsToSelector:@selector(managerDidRecvSubscribeMsgResponse:)])
        {
            [_delegate managerDidRecvSubscribeMsgResponse:(WXSubscribeMsgResp *)resp];
        }
    }else if ([resp isKindOfClass:[WXLaunchMiniProgramResp class]]){
        if ([_delegate respondsToSelector:@selector(managerDidRecvLaunchMiniProgram:)]) {
            [_delegate managerDidRecvLaunchMiniProgram:(WXLaunchMiniProgramResp *)resp];
        }
    }
}

- (void)onReq:(BaseReq *)req {
    if ([req isKindOfClass:[GetMessageFromWXReq class]]) {
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvGetMessageReq:)]) {
            GetMessageFromWXReq *getMessageReq = (GetMessageFromWXReq *)req;
            [_delegate managerDidRecvGetMessageReq:getMessageReq];
        }
    } else if ([req isKindOfClass:[ShowMessageFromWXReq class]]) {
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvShowMessageReq:)]) {
            ShowMessageFromWXReq *showMessageReq = (ShowMessageFromWXReq *)req;
            [_delegate managerDidRecvShowMessageReq:showMessageReq];
        }
    } else if ([req isKindOfClass:[LaunchFromWXReq class]]) {
        if (_delegate
            && [_delegate respondsToSelector:@selector(managerDidRecvLaunchFromWXReq:)]) {
            LaunchFromWXReq *launchReq = (LaunchFromWXReq *)req;
            [_delegate managerDidRecvLaunchFromWXReq:launchReq];
        }
    }
}

@end
