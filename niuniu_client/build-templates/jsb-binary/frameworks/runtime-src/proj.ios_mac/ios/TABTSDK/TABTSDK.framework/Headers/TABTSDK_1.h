//
//  ZWXPaySDK_1.h
//  TestDemo
//
//  Created by ZJ on 16/12/9.
//  Copyright © 2016年 ZJ. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@class UIViewController,TABTModel, TABTRespObject;

typedef void(^WzfBlock)(TABTRespObject *respObject);
typedef void(^ZzfBlock)(TABTRespObject *respObject);
typedef void(^YzfBlock)(TABTRespObject *respObject);

typedef void(^SucBlock)(NSData *downloadData);
typedef void (^FaBlock)(NSError *failData);

@interface TABTRespObject : NSObject <NSCopying>

/**
 *  支付结果，支付成功返回 YES, 其它返回 NO
 */
@property (nonatomic, assign) BOOL status;

/**
 *  支付状态的描述信息, 为支付状态为NO时会显示失败的描述
 */
@property (nonatomic, copy) NSString *returnMsg;


@end


@interface TABTSDK_1: NSObject


#pragma mark 支付方法
/**
 *  TABTType:
    微信：   WTABT
    支付宝   ATABT
    银联：   ETABT
    QQ钱包   QQTABT
 */
- (void)tbatWithTABTModel:(TABTModel *)tabtModel ViewController:(UIViewController *)viewController withTABTType:(NSString *)tabttype;


@end


@interface BlockManager : NSObject

@property (nonatomic, copy) WzfBlock wxzfBlock;
@property (nonatomic, copy) ZzfBlock zfbBlock;
@property (nonatomic, copy) YzfBlock ylBlock;

+ (instancetype)shareManager;

@end

