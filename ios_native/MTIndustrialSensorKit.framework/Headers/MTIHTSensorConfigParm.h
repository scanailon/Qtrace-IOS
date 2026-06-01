//
//  MTDeviceInfoData.h
//  MTSensorV3Kit
//
//  Created by minew on 2021/8/5.
//  Copyright © 2021 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>

@class MTIHTSensorWarmingSettingModel;

@interface MTIHTSensorConfigParm : NSObject

@property (nonatomic, strong) NSArray<MTIHTSensorWarmingSettingModel *> *MTIHTSensorWarmingSettingModels;

/// 采样间隔
@property (nonatomic, assign) NSInteger samplingInterval;

/// 延迟记录时间
@property (nonatomic, assign) NSInteger delayedInterval;

@end

