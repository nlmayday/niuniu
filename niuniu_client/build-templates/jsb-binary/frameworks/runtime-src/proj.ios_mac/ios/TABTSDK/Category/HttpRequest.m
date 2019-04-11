//
//  HttpRequest.m
//  TestDemo
//
//  Created by ZJ on 2017/10/16.
//  Copyright © 2017年 ZJ. All rights reserved.
//

#import "HttpRequest.h"

@interface HttpRequest ()<NSURLSessionTaskDelegate>

@property(nonatomic,copy)SuccessBlock sBlock;
@property(nonatomic, copy)FailBlock fBlock;

@end

@implementation HttpRequest

/**
 GET请求数据
 **/
-(void)getRequestDataWithUrlString:(NSString *)urlStr andSuccess:(SuccessBlock)successBlock orFail:(FailBlock)failBlock{
    HttpRequest *http = [[HttpRequest alloc] init];
    http.sBlock= successBlock;
    http.fBlock = failBlock;
    //1.构造NSURL
    NSURL *url = [NSURL URLWithString:urlStr];
    //2.创建请求对象
    NSURLRequest *request = [NSURLRequest requestWithURL:url];
    //3.创建NSURLSession对象
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    configuration.TLSMaximumSupportedProtocol = kTLSProtocol1;
    
    NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:[NSOperationQueue mainQueue]];
    NSURLSessionDataTask *task = [session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        
        //请求数据，返回请求的结果
        if (data) {
            //回到主线程
            dispatch_async(dispatch_get_main_queue(), ^{
                
                http.sBlock(data);
            });
        }
        
        else if(error)
        {
            
            dispatch_async(dispatch_get_main_queue(), ^{
                
                http.fBlock(error);
                
            });
            
            
        }
    }];
    
    
    //5.启动任务【开始发起异步请求】
    [task resume];
    
}


@end
