//
//  HTSensorWarmingSettingData.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/2/21.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTISensorCommon.h>

NS_ASSUME_NONNULL_BEGIN


@interface MTIHTSensorWarmingSettingModel : NSObject

// device type, Single temperature sensor or temperature and humidity sensor
@property (nonatomic, assign) MTIDeviceType deviceType;

// high temperature of device
// When the temperature value is invalid, it is 0 and the switch is off（isOpenTempAlarmSwitch is no）.
@property (nonatomic, assign) float highTemperature;

// low temperature of device
// When the temperature value is invalid, it is 0 and the switch is off（isOpenTempAlarmSwitch is no）.
@property (nonatomic, assign) float lowTemperature;

// high humidity of device
// When the Humidity value is invalid, it is 0 and the switch is off（isOpenHumiAlarmSwitch is no）.
@property (nonatomic, assign) float highHumidity;

// low humidity of device
// When the Humidity value is invalid, it is 0 and the switch is off（isOpenHumiAlarmSwitch is no）.
@property (nonatomic, assign) float lowHumidity;

// temperature alarm switch
@property (nonatomic, assign) BOOL isOpenTempAlarmSwitch;

// humidity alarm switch
@property (nonatomic, assign) BOOL isOpenHumiAlarmSwitch;
//

@end

NS_ASSUME_NONNULL_END
