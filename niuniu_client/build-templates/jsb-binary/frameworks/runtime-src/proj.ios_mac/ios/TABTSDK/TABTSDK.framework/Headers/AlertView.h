//
//  AlertView.h
//  TestDemo
//
//  Created by ZJ on 2017/1/5.
//  Copyright © 2017年 ZJ. All rights reserved.
//

#import <UIKit/UIKit.h>

@protocol AlertViewDelegate <NSObject>

//支付方法
/**
 *  TABTType:
 微信：   WTABT
 支付宝   ATABT
 银联：   ETABT
 QQ钱包   QQTABT
 */

-(void)TabtwithTABTType:(NSString *)tabttype;

//移除AlertView
- (void)removeAlertView;


@end

@interface AlertView : UIView

@property (nonatomic, copy) NSString *moneyString;
@property (nonatomic, weak) id<AlertViewDelegate> delegate;


@end




