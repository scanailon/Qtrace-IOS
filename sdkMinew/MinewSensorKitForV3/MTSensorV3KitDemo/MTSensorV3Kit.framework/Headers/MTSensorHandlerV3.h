//
//  MTSensorHandlerV3.h
//  MTSensorV3Kit
//
//  Created by minew on 2021/8/5.
//  Copyright © 2021 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTSensorV3Kit/MTSensorV3Common.h>
#import <MTSensorV3Kit/MTHistoryData.h>
#import <MTSensorV3Kit/MTDeviceInfoData.h>
#import <MTSensorV3Kit/MTBroadcastHandlerV3.h>

NS_ASSUME_NONNULL_BEGIN


@class MTHistoryData, MTConnectionHandlerV3, MTDeviceInfoData;

@protocol ConnectionDelegate;

typedef void(^MTReceiceResultOfSensorHandlerCompletion)(BOOL success);
typedef void(^MTReceiceHistoryOfSensorHandlerCompletion)(BOOL success, NSInteger totalNum, NSArray<MTHistoryData *> *data);
typedef void(^MTReceiceDeviceInfoOfSensorHandlerCompletion)(BOOL success ,MTDeviceInfoData *data);


@interface MTSensorHandlerV3 : NSObject


@property (nonatomic,weak) id<ConnectionDelegate> delegate;


/// Device password verification.
/// @param password password the device password.
/// @param completionHandler the receive block.
- (void)writePassword:(NSString *)password completionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Device reset.
/// @param completionHandler  the receive block.
- (void)resetDevice:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Get device HTSensor history.
/// @param formatter the date formatter.
/// @param unit the device temperature units.
- (void)readHTHistoryWithDateFormatter:(NSDateFormatter *)formatter Unit:(MTTemperatureUnitType)unit DeviceHTModelType:(MTHTModel)htModel completionHandler:(MTReceiceHistoryOfSensorHandlerCompletion)completionHandler;


/// Set alarm temperature and humidity for normal v3 device
/// @param maxTemp the hightest temperature of the device.
/// @param minTemp the low temperature of the device.
/// @param maxHumi  the hightest humidity of the device.
/// @param minHumi the low humidity of the device.
/// @param isTempWarn Whether to turn on the switch of the temperature alarm function.
/// @param isHumiWarn Whether to turn on the switch of the humidity alarm function.
- (void)setHTWarningWithMaxTemp:(float)maxTemp minTemp:(float)minTemp maxHumi:(float)maxHumi minHumi:(float)minHumi isTempWarn:(BOOL)isTempWarn isHumiWarn:(BOOL)isHumiWarn  completionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Device setting temperature unit.
/// @param temperatureUnitType  the device temperature unit type of temperature.
/// @param completionHandler the receive block.
- (void)setTemperatureUnit:(MTTemperatureUnitType)temperatureUnitType  completionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Device setting storageData.
/// @param storageStatus the device whether to store data.
/// @param completionHandler the receive block.
- (void)setStorageStatusOfHistoricalData:(BOOL)storageStatus completionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Get deveice info.
/// @param completionHandler the receive block.
- (void)readDeviceInfo:(MTReceiceDeviceInfoOfSensorHandlerCompletion)completionHandler;


/// Set device name.
/// @param deviceName the device name.
/// @param completionHandler the receive block.
- (void)setDeviceName:(NSString *)deviceName completionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Power off
/// @param completionHandler the receive block.
- (void)powerOffWithCompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set broadcast power
/// @param broadcastPower the value of broadcast power can only be set to -40, -20, -16, -12, -8, -4, 0, 4 dbm
/// @param completionHandler the receive block.
- (void)setBroadcastPower:(int)broadcastPower CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set broadcast interval  for industrial device
/// @param broadcastInterval the broadcast interval range is 100-5000ms.
/// @param completionHandler the receive block.
- (void)setBroadcastInterval:(int)broadcastInterval CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set delay record Time  for industrial device
/// @param delayTime the recording delay time range is 0 minutes to 18 hours, set in seconds.
/// @param completionHandler the receive block.
- (void)setDelayRecordTime:(int)delayTime CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set alarm temperature and humidity for industrial device
/// @param maxTemp1 the hightest temperature of the device.
/// @param minTemp1 the low temperature of the device.
/// @param maxTemp2 the second hightest temperature of the device.
/// @param minTemp2 the second low temperature of the device.
/// @param maxHumi  the hightest humidity of the device.
/// @param minHumi the low humidity of the device.
/// @param isTempWarn Whether to turn on the switch of the temperature alarm function.
/// @param isTempWarnSecond Whether to turn on the switch of the second temperature alarm function.
/// @param isHumiWarn Whether to turn on the switch of the humidity alarm function.
- (void)setIndustrialHTWarningWithMaxTemp1:(float)maxTemp1 minTemp1:(float)minTemp1 maxTemp2:(float)maxTemp2 minTemp2:(float)minTemp2 maxHumi:(float)maxHumi minHumi:(float)minHumi isTempWarn:(BOOL)isTempWarn isTempWarnSecond:(BOOL)isTempWarnSecond isHumiWarn:(BOOL)isHumiWarn  completionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Set broadcast interval  for industrial device. Only the version number is greater than or equal to 3.1.0 industrial temperature and humidity device have this feature.
/// @param broadcastIntervalForHTFrame the broadcast interval range for HT frame is 1000-60000ms.
/// @param broadcastIntervalForDeviceInfoFrame the broadcast interval for device info frame range is 100-5000ms.
/// @param completionHandler the receive block.
- (void)setBroadcastIntervalForHTFrame:(int)broadcastIntervalForHTFrame BroadcastIntervalForDeviceInfoFrame:(int)broadcastIntervalForDeviceInfoFrame CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Set collect interval  for industrial device. Only the version number is greater than or equal to 3.1.0 industrial temperature and humidity device have this feature.
/// @param collectInterval the collect interval range is 1s--24h. Unit is second.
/// @param completionHandler the receive block.
- (void)setCollectInterval:(int)collectInterval CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


@end

NS_ASSUME_NONNULL_END
