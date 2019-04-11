//
//  ViewController.m
//  TestDemo
//
//  Created by ZJ on 16/12/9.
//  Copyright © 2016年 SDKDemo. All rights reserved.
//

#import "ViewController.h"
#import <TABTSDK/TABTSDK.h>
#import "./TABTSDK/Category/NSString+Encrypt.h"
#import "./TABTSDK/Category/HttpRequest.h"
#import "ScriptingCore.h"
@interface ViewController ()<AlertViewDelegate>

@property (nonatomic, strong) TABTModel    *tabtModel;
@property (nonatomic, strong) UIButton       *payTestButton;
@property (nonatomic, strong) UIButton       *payTestButton1;
@property (nonatomic, strong) UIButton       *payTestButton2;
@property (nonatomic, strong) TABTSDK_1    *tabtSDK;
@property (nonatomic, strong) AlertView      *alert;

//查询订单状态
@property (nonatomic, assign) BOOL isTabt;
@property (nonatomic, copy)NSString *sign;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.title = @"乐多棋牌";
    self.view.backgroundColor = [UIColor whiteColor];
    [self.view addSubview:self.payTestButton];
    
    self.tabtSDK = [[TABTSDK_1 alloc]init];
    
    self.tabtModel = [[TABTModel alloc] init];
    
    /*************tabtWay和sign不用传******其他所有参数不能为空********/
    
    /***partnerId、appId、key商户测试时请换成自己的参数
     测试前请告知运营appid配置相应通道进行测试********/
    self.tabtModel.partnerId = @"1000100020001732";
    self.tabtModel.appId = @"4060";
    self.tabtModel.key = @"060926051BC4442A9134987FD5C1E4FA";
    /***partnerId、appId、key商户测试时请换成自己的参数
     测试前请告知运营appid配置相应通道进行测试********/
    
    
    self.tabtModel.qn = @"zyap4060_57075_100";//生产环境:生成appid时 随机qn
    //self.tabtModel.subject = @"商品名称";
    //self.tabtModel.money = @"100";//以分为单位 不能出现小数
    self.tabtModel.appName = @"乐多麻将";
    
    self.tabtModel.packageName = @"com.xianyu.leduo";
    
    /*************tabtWay和sign不用传******其他所有参数不能为空********/
    
    
}

#pragma mark - getter/setter
- (UIButton *)payTestButton
{
    if (_payTestButton == nil) {
        _payTestButton = [UIButton buttonWithType:UIButtonTypeCustom];
        
        [_payTestButton setTitle:@"支付" forState:UIControlStateNormal];
        _payTestButton.frame = CGRectMake(100, 200, self.view.frame.size.width - 200, 80);
        [_payTestButton setBackgroundColor:[UIColor lightGrayColor]] ;
        [_payTestButton addTarget:self action:@selector(tabtTest) forControlEvents:UIControlEventTouchUpInside];
    }
    return _payTestButton;
}

#pragma mark - 支付
- (void)tabtTest
{
    if (self.alert.superview) {
        return;
    }
    [self addAlertView];
}
#pragma mark 移除AlertView

- (void)removeAlertView
{
    if (self.alert.superview) {
        [self.alert removeFromSuperview];
    }
}

#pragma mark 添加AlertView
- (void)addAlertView
{
    NSString *bundlePath = [[NSBundle mainBundle]pathForResource:@"TABTSDKBundle" ofType:@"bundle"];
    NSBundle *resourceBundle = [NSBundle bundleWithPath:bundlePath];
    UINib *nib = [UINib nibWithNibName: @"AlertView"  bundle:resourceBundle];
    NSArray *viewObjs = [nib instantiateWithOwner:nil options:nil];
    self.alert = viewObjs.lastObject;
    self.alert.delegate = self;
    self.alert.frame = CGRectMake(self.view.center.x - 140, self.view.center.y - 150, 280 ,300);
    
    self.alert.moneyString = self.tabtModel.money;
    [self.view addSubview:self.alert];
    
}
#pragma mark 支付方法
-(void)TabtwithTABTType:(NSString *)tabttype{

    /**
     *  调用前请先判断用户是否安装了微信、支付宝、QQ,请处理未安装情况
     
     */
    
    [self removeAlertView];
    
    if (![[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"weixin://"]])
    {   [self alertMsg:@"微信未安装"];
        NSLog(@"微信未安装--商户自行处理【跳转AppStore/其他】");
        return;
    }
    if (![[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"alipay://"]])
    {   [self alertMsg:@"支付宝未安装"];
        NSLog(@"支付宝未安装--商户自行处理【跳转AppStore/其他】");
        return;
    }
    if (![[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"mqq://"]])
    {   [self alertMsg:@"QQ未安装"];
        NSLog(@"QQ未安装--商户自行处理【跳转AppStore/其他】");
        return;
    }
    
    NSLog(@"TABTType %@",tabttype);

    /************中文参数 和 outTradeNo  要进行encode处理********/
    self.tabtModel.outTradeNo = [NSString stringWithFormat:@"261215|0955%u",arc4random() % 100000];//订单号不能重复 重复报错1006/1003
    
    self.tabtModel.outTradeNo =  [self.tabtModel.outTradeNo stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
    self.tabtModel.subject =  [self.tabtModel.subject stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
    self.tabtModel.appName = [self.tabtModel.appName stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
    /************中文参数 和 outTradeNo  要进行encode处理********/
    
    self.isTabt = YES;
    
    //调用支付方法
    [self.tabtSDK tbatWithTABTModel:self.tabtModel ViewController:self withTABTType:tabttype];

}

- (void)alertMsg:(NSString *)msg
{
    UIAlertView * alert = [[UIAlertView alloc] initWithTitle:@"提示" message:msg delegate:nil cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
    [alert show];
}



#pragma mark 查询订单状态
-(void)viewWillAppear:(BOOL)animated
{
    
    [super viewWillAppear:animated];
    
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(searchtabtinvoice)
                                                 name:UIApplicationDidBecomeActiveNotification object:nil];
}
-(void)searchtabtinvoice{
    
    if ([self isTabt] == NO) {
        return;
    }
    if (self.tabtModel.outTradeNo.length > 0) {
        self.sign = [NSString stringWithFormat:@"app_id=%@&out_trade_no=%@&partner_id=%@&key=%@",self.tabtModel.appId,self.tabtModel.outTradeNo,self.tabtModel.partnerId,self.tabtModel.key];
        
        self.sign = self.sign.MD5;
        
        
        NSString *surl = [NSString stringWithFormat:@"https://game.csl2016.cn/queryOrder.e?partner_id=%@&app_id=%@&out_trade_no=%@&sign=%@",self.tabtModel.partnerId,self.tabtModel.appId,self.tabtModel.outTradeNo,self.sign];
        HttpRequest *ression = [[HttpRequest alloc] init];
        TABTRespObject *res = [[TABTRespObject alloc] init];
        
        [ression getRequestDataWithUrlString:surl andSuccess:^(NSData *downloadData) {
            NSError *err;
            NSDictionary *dic = [NSJSONSerialization JSONObjectWithData:downloadData
                                                                options:NSJSONReadingMutableLeaves
                                                                  error:&err];
            NSString *result = [[NSString alloc] initWithData:downloadData  encoding:NSUTF8StringEncoding];
            NSLog(@"掌宜付服务器请求返回-- %@",result);
            if ([dic[@"code"] isEqualToString:@"0"]) {
                res.status = YES;
                res.returnMsg = @"支付成功";
                NSString *jsCallStr = [NSString stringWithFormat:@"%@(\"%@\")",@"cc.vv.anysdkMgr.onWXPayResp", result];                NSLog(@"jsCallStr = %@", jsCallStr);
                std::string jsca =  [jsCallStr cStringUsingEncoding:NSUTF8StringEncoding];
                ScriptingCore::getInstance()->evalString(jsca.c_str());
            }
            else if ([dic[@"code"] isEqualToString:@"1"]){
                res.returnMsg = @"交易处理中";
            }
            else if ([dic[@"code"] isEqualToString:@"2"]){
                res.returnMsg = @"交易未完成";
            }else if ([dic[@"code"] isEqualToString:@"3"]){
                res.returnMsg = @"无此订单号";
            }else {
                res.returnMsg = @"支付失败";
            }
            
            NSLog(@"支付状态：%d -- 支付结果：%@",res.status,res.returnMsg);
            [self alertMsg:res.returnMsg];
            self.isTabt = NO;
            
        } orFail:^(NSError *failData) {
            
            self.isTabt = NO;
            NSLog(@"failData %@",failData);
            
        }];
    }
}
-(void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    
}
@end
