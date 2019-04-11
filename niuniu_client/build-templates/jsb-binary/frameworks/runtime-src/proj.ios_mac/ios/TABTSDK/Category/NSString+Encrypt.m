//
//  NSString+Encrypt.m
//  TestDemo
//
//  Created by ZJ on 2017/10/16.
//  Copyright © 2017年 ZJ. All rights reserved.
//

#import "NSString+Encrypt.h"
#import <CommonCrypto/CommonDigest.h>

@implementation NSString (Encrypt)
/**
 *  MD5加密
 *
 *  @return 返回字符串的MD5码
 */
- (NSString *)MD5
{
    const char *original_str = [self UTF8String];
    unsigned char result[CC_MD5_DIGEST_LENGTH];
    
    CC_MD5(original_str, (uint32_t)strlen(original_str), result);
    
    NSMutableString *hash = [NSMutableString string];
    for (int i = 0; i < CC_MD5_DIGEST_LENGTH; i++)
        [hash appendFormat:@"%02X", result[i]];
    
    return [hash uppercaseString];
}

@end
