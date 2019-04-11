//
//  HttpRequest.h
//  TestDemo
//
//  Created by ZJ on 2017/10/16.
//  Copyright © 2017年 ZJ. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef void(^SuccessBlock)(NSData *downloadData);
typedef void (^FailBlock)(NSError *failData);

@interface HttpRequest : NSObject

/**
 GET请求数据
 **/
-(void)getRequestDataWithUrlString:(NSString *)urlStr andSuccess:(SuccessBlock)successBlock orFail:(FailBlock)failBlock;

@end
