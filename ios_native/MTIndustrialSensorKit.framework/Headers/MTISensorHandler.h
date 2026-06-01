//
//  MTSensorHandlerV3.h
//  MTSensorV3Kit
//
//  Created by minew on 2021/8/5.
//  Copyright © 2021 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTISensorCommon.h>
#import <MTIndustrialSensorKit/MTIHistoryData.h>
#import <MTIndustrialSensorKit/MTIHTSensorConfigParm.h>
#import <MTIndustrialSensorKit/MTIHTSensorWarmingSettingModel.h>
#import <MTIndustrialSensorKit/MTIAdvertisingParametersData.h>


NS_ASSUME_NONNULL_BEGIN


@class MTIHistoryData, MTIConnectionHandler, MTIHTSensorConfigParm, MTIDoorContactTimeListData;

@protocol ConnectionDelegateVersion3;

typedef void(^MTReceiceResultOfSensorHandlerCompletion)(BOOL success);
typedef void(^MTReceiceHistoryOfSensorHandlerCompletion)(BOOL success, NSInteger totalNum, NSArray<MTIHistoryData *> *data);
typedef void(^MTReceiceDeviceInfoOfSensorHandlerCompletion)(BOOL success ,MTIHTSensorConfigParm *data);
typedef void(^MTReceiceAdvertisingParmetersOfSensorHandlerCompletion)(BOOL success ,MTIAdvertisingParametersData *data);
typedef void(^MTReceiceHTSensorConfigurationOfSensorHandlerCompletion)(BOOL success ,MTIHTSensorConfigParm *data);
typedef void(^MTReceiceTemperatureUnitOfSensorHandlerCompletion)(BOOL success ,MTITemperatureUnitType unitType);

typedef void(^MTReceiceResultOfDoorSensorHandlerCompletion)(BOOL optionSwitch1, BOOL optionSwitch2);
typedef void(^MTReceiceResultOfDoorSensorTimeHandlerCompletion)(BOOL success, NSInteger totalNum, NSArray<MTIDoorContactTimeListData *> *data);

@interface MTISensorHandler : NSObject


@property (nonatomic,weak) id<ConnectionDelegateVersion3> delegate;


/// Device reset.
/// @param completionHandler  the receive block.
- (void)resetDevice:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Read historical temperature and humidity data
/// @param formatter the time format you want
/// @param unit temperature unit
/// @param startTimeInterval the start timestamp
/// @param endTimeInterval the end timestamp
/// @param systemTimeInterval the real-time timestamp
/// @param htModel For the device type, only MST01 can be selected for the current version
/// @param completionHandler the receive block
- (void)readHTHistoryWithDateFormatter:(NSDateFormatter *)formatter Unit:(MTITemperatureUnitType)unit StartTimeInterval:(NSTimeInterval)startTimeInterval EndTimeInterval:(NSTimeInterval)endTimeInterval SystemTimeInterval:(NSTimeInterval)systemTimeInterval DeviceHTModelType:(MTIHTModel)htModel completionHandler:(MTReceiceHistoryOfSensorHandlerCompletion)completionHandler;


/// Device setting temperature unit.
/// @param temperatureUnitType  the device temperature unit type of temperature.
/// @param completionHandler the receive block.
- (void)setTemperatureUnit:(MTITemperatureUnitType)temperatureUnitType  completionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;



/// Power off
/// @param completionHandler the receive block.
- (void)powerOffWithCompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Device getting temperature unit.
/// @param completionHandler the receive block.
- (void)getTemperatureUnit:(MTReceiceTemperatureUnitOfSensorHandlerCompletion)completionHandler;


/// Set device information frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param completionHandler the receive block.
- (void) setDeviceInfoFrameAdvertisingParametersConfiguration:(int) advertisingInterval TxPower:(int)txPower CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set industrial temperature and humidity frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param deviceName device name
/// @param completionHandler the receive block.
- (void) setIndustryHTFrameAdvertisingParametersConfiguration:(NSInteger)advertisingInterval TxPower:(int)txPower DeveceName:(NSString *)deviceName CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Set industrial temperature and humidity frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param deviceName device name
/// @param completionHandler the receive block.
- (void) setLoraWanHTFrameAdvertisingParametersConfiguration:(NSInteger)advertisingInterval TxPower:(int)txPower DeveceName:(NSString *)deviceName CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Get the device information frame broadcast parameters
/// @param completionHandler the receive block.
- (void) getDeviceInfoFrameAdvertisingParameters:(MTReceiceAdvertisingParmetersOfSensorHandlerCompletion)completionHandler;


/// Get the industrial temperature and humidity frame broadcast parameters
/// @param completionHandler the receive block.
- (void) getIndustryHTFrameAdvertisingParameters:(MTReceiceAdvertisingParmetersOfSensorHandlerCompletion)completionHandler;


/// Set the industrial humidity and temperature sensor configuration
/// @param htSettingDatas Trigger threshold list fixed length 2
/// @param samplingInterval The sampling interval is in milliseconds
/// @param completionHandler the receive block.
- (void)setIndustryHTSensorConfiguration: (NSArray<MTIHTSensorWarmingSettingModel *> *)htSettingDatas SamplingInterval:(int)samplingInterval CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set the pt100  temperature sensor configuration
/// @param htSettingDatas Trigger threshold list fixed length 2
/// @param samplingInterval The sampling interval is in milliseconds
/// @param delayedInterval The sampling delayed is in milliseconds
/// @param completionHandler the receive block.
- (void)setOnlyTemSensorConfiguration: (NSArray<MTIHTSensorWarmingSettingModel *> *)htSettingDatas SamplingInterval:(int)samplingInterval DelayedInterval:(int)delayedInterval CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Get industrial humidity and temperature sensor configurations
/// @param completionHandler the receive block.
- (void)getIndustryHTSensorConfiguration:(MTReceiceHTSensorConfigurationOfSensorHandlerCompletion)completionHandler;


/// Set industrial temperature and humidity frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param deviceName device name
/// @param completionHandler the receive block.
- (void) setAssetTemFrameAdvertisingParametersConfiguration:(NSInteger)advertisingInterval TxPower:(int)txPower DeveceName:(NSString *)deviceName CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Get industrial humidity and temperature sensor configurations
/// @param completionHandler the receive block.
- (void)getAssetTemSensorConfiguration:(MTReceiceHTSensorConfigurationOfSensorHandlerCompletion)completionHandler;


- (void)getDoorcontrolTriggerConfiguration:(MTReceiceAdvertisingParmetersOfSensorHandlerCompletion)completionHandler;

/// Set industrial temperature and humidity frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param alwaysD device name
/// @param completionHandler the receive block.
- (void) setDoorcontrolFrameAdvertisingParametersConfiguration:(NSInteger)advertisingInterval TxPower:(int)txPower alwaysD:(BOOL)alwaysD CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Read historical temperature and humidity data
/// @param formatter the time format you want
/// @param unit temperature unit
/// @param startTimeInterval the start timestamp
/// @param endTimeInterval the end timestamp
/// @param systemTimeInterval the real-time timestamp
/// @param htModel For the device type, only MST01 can be selected for the current version
/// @param completionHandler the receive block
- (void)readAssetTemHistoryWithDateFormatter:(NSDateFormatter *)formatter StartTimeInterval:(NSTimeInterval)startTimeInterval EndTimeInterval:(NSTimeInterval)endTimeInterval SystemTimeInterval:(NSTimeInterval)systemTimeInterval completionHandler:(MTReceiceHistoryOfSensorHandlerCompletion)completionHandler;

/// Set industrial temperature and humidity frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param deviceName device name
/// @param completionHandler the receive block.
- (void) setDoorContactHTFrameAdvertisingParametersConfiguration:(NSInteger)advertisingInterval TxPower:(int)txPower TimeValue:(int)timeValue CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// 门磁同步时间
/// @param systemTime 当前时间
/// @param completionHandler the receive block
- (void)asyDevicesSystemTime:(NSTimeInterval)systemTime withReceiceResultHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// 获取门磁灯光开关&门磁数据开关
/// @param completionHandler the receive block
- (void)getDoorContactOptionSwitch:(MTReceiceResultOfDoorSensorHandlerCompletion)completionHandler;

/// 查询设备在一天中保持正常工作的时间段
/// @param completionHandler the receive block
- (void)getWorkPeriodsConfiguration:(MTReceiceResultOfDoorSensorTimeHandlerCompletion)completionHandler;

/// 设置设备在一天中保持正常工作的时间段
/// @param completionHandler the receive block
- (void)setWorkPeriodsConfiguration:(NSArray<MTIDoorContactTimeListData*>*)dataList withHandlerCompletion:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// 配置门磁灯光开关
/// @param swithIsOn swithIsOn status
/// @param completionHandler the receive block
- (void)setDoorContactOptionSwitch:(BOOL)swithIsOn withReceiceResultHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// 配置门磁数据开关
/// @param swithIsOn swithIsOn status
/// @param completionHandler the receive block
- (void)setDoorContactDataOptionSwitch:(BOOL)swithIsOn withReceiceResultHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Read historical temperature and humidity data
/// @param formatter the time format you want
/// @param unit temperature unit
/// @param startTimeInterval the start timestamp
/// @param endTimeInterval the end timestamp
/// @param systemTimeInterval the real-time timestamp
/// @param htModel For the device type, only MST01 can be selected for the current version
/// @param completionHandler the receive block
- (void)readDoorContactHistoryWithDateFormatter:(NSDateFormatter *)formatter Unit:(MTITemperatureUnitType)unit StartTimeInterval:(NSTimeInterval)startTimeInterval EndTimeInterval:(NSTimeInterval)endTimeInterval SystemTimeInterval:(NSTimeInterval)systemTimeInterval DeviceHTModelType:(MTIHTModel)htModel completionHandler:(MTReceiceResultOfDoorSensorTimeHandlerCompletion)completionHandler;

/// pt100
/// @param completionHandler the receive block
- (void)getPt100TemSensorConfiguration:(MTReceiceHTSensorConfigurationOfSensorHandlerCompletion)completionHandler;

/// Read historical temperature and humidity data
/// @param formatter the time format you want
/// @param unit temperature unit
/// @param startTimeInterval the start timestamp
/// @param endTimeInterval the end timestamp
/// @param systemTimeInterval the real-time timestamp
/// @param htModel For the device type, only MST01 can be selected for the current version
/// @param completionHandler the receive block
- (void)readOnlyTemHistoryWithDateFormatter:(NSDateFormatter *)formatter Unit:(MTITemperatureUnitType)unit StartTimeInterval:(NSTimeInterval)startTimeInterval EndTimeInterval:(NSTimeInterval)endTimeInterval SystemTimeInterval:(NSTimeInterval)systemTimeInterval DeviceHTModelType:(MTIHTModel)htModel completionHandler:(MTReceiceHistoryOfSensorHandlerCompletion)completionHandler;

@end

NS_ASSUME_NONNULL_END
