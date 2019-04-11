//
//  ZWXPayModel.h
//  WZXSDKDemo
//
//  Created by ZJ on 16/12/9.
//  Copyright © 2016年 zj. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface TABTModel : NSObject
/** 需 传进来的参数 */

/** 新用户注册时自动生成，商户partnerId */
@property (nonatomic ,copy)NSString *partnerId;

/** 新用户注册完成后 自己添加应用，应用appId */
@property (nonatomic ,copy)NSString *appId;

/** 新用户注册时自动生成，MD5私钥  生产环境客户端不需要传 */
@property (nonatomic ,copy)NSString *key;

/** 应用名称 */
@property (nonatomic ,copy)NSString *appName;

/** 应用包名 */
@property (nonatomic ,copy)NSString *packageName;

/** 计费点对应的金额，单位：分 */
@property (nonatomic ,copy)NSString *money;

/** 商户订单编号 out_trade_no 最大长度60，不支持jason对象toString */
@property (nonatomic ,copy)NSString *outTradeNo;

//商品名称  UTF-8编码
@property (nonatomic ,copy)NSString *subject;

/** 渠道号，由商户在后台选择 最大长度20，不支持jason对象toString*/
@property (nonatomic ,copy)NSString *qn;


//签名  所有参数按照文档顺序 MD5 32位 大写 加密
@property (nonatomic ,copy)NSString *sign;



//支付方式
//1、微信
//2、支付宝
//3、QQ
//9、银联
@property (nonatomic ,copy)NSString *tabtWay;


@end
