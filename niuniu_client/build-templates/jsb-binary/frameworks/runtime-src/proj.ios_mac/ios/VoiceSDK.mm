//
//  VoiceConverter.m
//  Jeans
//
//  Created by Jeans Huang on 12-7-22.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "VoiceSDK.h"
#import "interf_dec.h"
#import "dec_if.h"
#import "interf_enc.h"
#import "amrFileCodec.h"

static NSString* storageDir;
static AVAudioRecorder  *recorder;
static AVAudioPlayer    *player;


@implementation VoiceSDK

//转换amr到wav
+ (int)ConvertAmrToWav:(NSString *)aAmrPath wavSavePath:(NSString *)aSavePath{
    
    if (! DecodeAMRFileToWAVEFile([aAmrPath cStringUsingEncoding:NSASCIIStringEncoding], [aSavePath cStringUsingEncoding:NSASCIIStringEncoding]))
        return 0;
    
    return 1;
}

//转换wav到amr
+ (int)ConvertWavToAmr:(NSString *)aWavPath amrSavePath:(NSString *)aSavePath{
    
    if (! EncodeWAVEFileToAMRFile([aWavPath cStringUsingEncoding:NSASCIIStringEncoding], [aSavePath cStringUsingEncoding:NSASCIIStringEncoding], 1, 16))
        return 0;
    
    return 1;
}

//获取录音设置
+ (NSDictionary*)GetAudioRecorderSettingDict{
    NSDictionary *recordSetting = [[NSDictionary alloc] initWithObjectsAndKeys:
                                   [NSNumber numberWithFloat: 8000.0],AVSampleRateKey, //采样率
                                   [NSNumber numberWithInt: kAudioFormatLinearPCM],AVFormatIDKey,
                                   [NSNumber numberWithInt:16],AVLinearPCMBitDepthKey,//采样位数 默认 16
                                   [NSNumber numberWithInt: 1], AVNumberOfChannelsKey,//通道的数目
                                   //                                   [NSNumber numberWithBool:NO],AVLinearPCMIsBigEndianKey,//大端还是小端 是内存的组织方式
                                   //                                   [NSNumber numberWithBool:NO],AVLinearPCMIsFloatKey,//采样信号是整数还是浮点数
                                   //                                   [NSNumber numberWithInt: AVAudioQualityMedium],AVEncoderAudioQualityKey,//音频编码质量
                                   nil];
    return recordSetting;
}

NSString* _recordFilePath;
NSString* _wavFilePath;

+(void)prepareRecord:(NSString*)recordFilePath{
    recordFilePath = [storageDir stringByAppendingString:recordFilePath];
    _recordFilePath = [recordFilePath copy];
    _wavFilePath = [[recordFilePath stringByAppendingString:@".wav"] copy];
    //初始化录音
    NSError *error = nil;
    recorder = [[AVAudioRecorder alloc]initWithURL:[NSURL fileURLWithPath:_wavFilePath]
                                          settings:[VoiceSDK GetAudioRecorderSettingDict]
                                             error:&error];
    
    if(error){
        NSLog(@"move failed:%@",[error localizedDescription]);
    }
    
    //准备录音
    if ([recorder prepareToRecord]){
        
        
        [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayAndRecord error:nil];
        [[AVAudioSession sharedInstance] setActive:YES error:nil];
        
        //开始录音
        [recorder record];
    }
    //return FALSE;
}

+(AVAudioPlayer*) audioPlayer{
    return player;
}
+(AVAudioRecorder*) audioRecorder{
    return recorder;
}

+(void)finishRecord{
    if(recorder.isRecording){
        [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayback error:nil];
        [recorder stop];
#warning wav转amr
        if ([VoiceSDK ConvertWavToAmr:_wavFilePath amrSavePath:_recordFilePath]){
        }
        else{
            NSLog(@"failed to translate wav to amr");
        }
    }
}
+(void)cancelRecord{
    if(recorder.isRecording){
        [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayback error:nil];
        [recorder stop];
    }
}

+(void)play:(NSString*)filePath{
    filePath = [storageDir stringByAppendingString:filePath];
    NSString* amrPath = filePath;
    NSString* wavPath = [filePath stringByAppendingString:@".wav"];
    if(player && player.isPlaying){
        [player stop];
    }
    if([VoiceSDK ConvertAmrToWav:amrPath wavSavePath:wavPath]){
        NSError *error = nil;
        if(player == nil){
            player = [[AVAudioPlayer alloc]init];
        }
        player = [player initWithContentsOfURL:[NSURL URLWithString:wavPath] error:&error];
        if(error){
            NSLog(@"move failed:%@",[error localizedDescription]);
        }
        if(![player play]){
            NSLog(@"play failed");
        }
        
    }
    else{
        NSLog(@"failed to translate amr to wav");
    }
}
+(void)stopPlay{
    if(player && player.isPlaying){
        [player stop];
    }
}

+(void)setStorageDir:(NSString*)dir{
    storageDir = [dir copy];
}

@end
