//
//  MTIAdvertisingParametersData.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/2/28.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTISensorCommon.h>


NS_ASSUME_NONNULL_BEGIN

@interface MTIAdvertisingParametersData : NSObject

@property (nonatomic, assign) MTIFrameType frameType;

// adv interval, unit is ms
@property (nonatomic, assign) NSInteger advertisingInterval;

// txpower, can only be -40, -20, -16, -12, -8, -4, 0, 4dBm
@property (nonatomic, assign) int txPower;

// 0 - Always Advertising 1 - Advertising by Trigger
@property (nonatomic, assign) BOOL isAlwaysAdvertising;

@property (nonatomic, assign) int timeValues;

// device name
@property (nonatomic, strong) NSString *deviceName;



@end

NS_ASSUME_NONNULL_END
