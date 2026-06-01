//
//  MTITempHumiFrame.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/3/23.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTIFrame.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTITempHumiFrame : MTIFrame

// name of device
@property (nonatomic, strong) NSString *name;

// Temperature
@property (nonatomic, assign) double temp;

// Humidity
@property (nonatomic, assign) double humi;

//Temperature unit
@property (nonatomic, assign) MTITemperatureUnitType temperatureUnit;

// broadcast frame type, HT or SingleTemp.
@property (nonatomic, assign) MTIDeviceType deviceType;

// device warningStatus, Normal or AbNormal.
@property (nonatomic, assign) MTIWarningType deviceWarningStatus;

// screenStatus, Normal or AbNormal.
@property (nonatomic, assign) MTIWarningType screenStatus;

// mark status
@property (nonatomic, assign) BOOL isMarkStatus;

// device's model of HT, the current version is only MST01.
@property (nonatomic, assign) MTIHTModel htModel;

/// 定制版本
// battery
@property (nonatomic, assign) NSInteger battery;

// mac string
@property (nonatomic, strong) NSString *mac;

// firm version
@property (nonatomic, strong) NSString *firmVersion;

@end

NS_ASSUME_NONNULL_END
