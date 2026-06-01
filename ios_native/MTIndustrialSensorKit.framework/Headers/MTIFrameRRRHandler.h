//
//  MTIFrameRRRHandler.h
//  MTIndustrialSensorKit
//
//  Created by jelonCai on 2023/9/21.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTIFrameRRRHandler : NSObject

// current rssi value
@property (nonatomic, assign) NSInteger rssi;

// battery
@property (nonatomic, assign) NSInteger battery;

// mac string, sometimes available
@property (nonatomic, strong) NSString *mac;
// name of device, sometimes available
@property (nonatomic, strong) NSString *name;

@property (nonatomic, assign) float temperatureShow;

@property (nonatomic, assign) NSInteger cteFlag;
@property (nonatomic, assign) NSInteger cteLength;
@property (nonatomic, assign) NSInteger counter;
@property (nonatomic, strong) NSData *rawDataHex;
//参考功率Measured Power显示
@property (nonatomic, assign) NSInteger measuredPower;
// 解密用的
@property (nonatomic, assign) NSInteger noneSalt;
// 辅助属性
@property (nonatomic, assign) NSInteger noneCounter;
@property (nonatomic, assign) long updateLTime;

@end

NS_ASSUME_NONNULL_END
