//
//  MTDeviceInfoData.h
//  MTSensorV3Kit
//
//  Created by minew on 2021/8/5.
//  Copyright © 2021 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTSensorV3Kit/MTSensorV3Common.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSUInteger, MTDeviceInfoType) {
    MST01Info = 1,
    PR2122Info,
    MST01InfoOfHighVersion,
};

@interface MTDeviceInfoData : NSObject


// version
@property (nonatomic, assign, readonly) MTDeviceInfoType deviceInfoType;

// firm version
@property (nonatomic, strong, readonly) NSString *firmVersion;

// The broadcast interval of two frames, regardless of frame type. Unit is ms.Only S3 and version number lower than 3.1.0 industrial temperature and humidity are required.
@property (nonatomic, assign, readonly) NSInteger advInterval;

// The broadcast interval of humidity and temperature frames. Unit is ms.Only the version number is greater than or equal to 3.1.0 industrial temperature and humidity are required.
@property (nonatomic, assign, readonly) NSInteger advIntervalForHTFrame;

// The broadcast interval of device info frames. Unit is ms.Only the version number is greater than or equal to 3.1.0 industrial temperature and humidity are required.
@property (nonatomic, assign, readonly) NSInteger advIntervalForInfoFrame;

// The collect interval of humidity and temperature frames. Unit is ms.Only the version number is greater than or equal to 3.1.0 industrial temperature and humidity are required.
@property (nonatomic, assign, readonly) NSInteger collectIntervalForHTFrame;

// broadcast power
@property (nonatomic, assign, readonly) NSInteger advTxpower;

// temperature alarm switch
@property (nonatomic, assign, readonly) BOOL isOpenTempAlarmSwitch;

// the second temperature alarm switch
@property (nonatomic, assign, readonly) BOOL isOpenTempAlarmSwitchSecond;

// humidity alarm switch
@property (nonatomic, assign, readonly) BOOL isOpenHumiAlarmSwitch;

// temperature warning upper bound
@property (nonatomic, assign, readonly) double highTempAlarm;

// temperature warning lower bound
@property (nonatomic, assign, readonly) double lowTempAlarm;

// the second temperature warning upper bound, Only MST01 devices are available
@property (nonatomic, assign, readonly) double secondHighTempAlarm;

// the second temperature warning lower bound, Only MST01 devices are available
@property (nonatomic, assign, readonly) double secondLowTempAlarm;

// humidity warning upper bound
@property (nonatomic, assign, readonly) double highHumiAlarm;

// humidity warning upper bound
@property (nonatomic, assign, readonly) double lowHumiAlarm;

// temperature resolution, Only V3 devices are available
@property (nonatomic, assign, readonly) double temperatureResolution;

// humidity resolution, Only V3 devices are available
@property (nonatomic, assign, readonly) double humidityResolution;

// real-time temperature
@property (nonatomic, assign, readonly) double realTimeTemperature;

// real-time humidity
@property (nonatomic, assign, readonly) double realTimeHumidity;

// temperature unit, Celsius/Fahrenheit
@property (nonatomic, assign, readonly) MTTemperatureUnitType temperatureUnitType;

// whether to start storing
@property (nonatomic, assign, readonly) BOOL isStorage;

// device name
@property (nonatomic, strong, readonly) NSString *deviceName;

// delay record time of device
@property (nonatomic, assign, readonly) int delayRecordTime;

@end

NS_ASSUME_NONNULL_END
