//
//  MTRadarSensorHandler.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/4/1.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTISensorCommon.h>
#import <MTIndustrialSensorKit/MTIndustrialSensorKit.h>
#import <MTIndustrialSensorKit/MTMillimeterRadarSensorInfo.h>


NS_ASSUME_NONNULL_BEGIN


@class MTRCoordinateRadarSensorInfo, MTRTrafficMonitorRadarSensorInfo;

typedef void(^OperationCompletion)(BOOL success, NSError *error);
typedef void(^MTReceiceFirmwareVersionOfRadarSensorHandlerCompletion)(BOOL success ,NSString *firmwareVersion);
typedef void(^MTReceiceSensorInfoHandlerCompletion)(BOOL success, MTRadarInfoType infoType, MTMillimeterRadarSensorInfo *coordinateRadarSensorInfo);


typedef void(^MTReceiceResultOfSensorHandlerCompletion)(BOOL success);





@interface MTRadarSensorHandler : NSObject

@property (nonatomic,weak) id<ConnectionDelegateVersion3> delegate;




/// Get FirmwareVersion
/// @param completionHandler the receive block.
- (void)getFirmwareVersion:(MTReceiceFirmwareVersionOfRadarSensorHandlerCompletion)completionHandler;

/// Get radar sensor's configuration
/// @param completionHandler the receive block.
- (void)getRadarSensorConfiguration:(MTReceiceSensorInfoHandlerCompletion)completionHandler;


/// Set radar sensor configuration
/// @param completionHandler the receive block.
- (void)setRadarSensorConfigurationWithCommandDic:(NSDictionary<NSNumber *,id> *)commandDic RadarType:(MTRadarInfoType)radarType CompletionHandler:(OperationCompletion)completionHandler;

/// Device restore
/// @param completionHandler the receive block.
- (void)restoreDeviceWithRadarType:(MTRadarInfoType)radarType CompletionHandler:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Device learn
/// @param completionHandler  the receive block.
- (void)setLearn:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Device reset.
/// @param completionHandler  the receive block.
- (void)resetDevice:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;

/// Power off
/// @param completionHandler the receive block.
- (void)powerOffWithCompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set device information frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param completionHandler the receive block.
- (void) setDeviceInfoFrameAdvertisingParametersConfiguration:(int) advertisingInterval TxPower:(int)txPower CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Set radar frame broadcast parameters
/// @param advertisingInterval Broadcast interval in milliseconds
/// @param txPower -40 -20 -16 -12 -8 -4 0 4dBm
/// @param deviceName device name
/// @param completionHandler the receive block.
- (void) setRadarFrameAdvertisingParametersConfiguration:(NSInteger)advertisingInterval TxPower:(int)txPower DeveceName:(NSString *)deviceName CompletionHandle:(MTReceiceResultOfSensorHandlerCompletion)completionHandler;


/// Get the device information frame broadcast parameters
/// @param completionHandler the receive block.
- (void) getDeviceInfoFrameAdvertisingParameters:(MTReceiceAdvertisingParmetersOfSensorHandlerCompletion)completionHandler;


/// Get the radar frame broadcast parameters
/// @param completionHandler the receive block.
- (void) getRadarFrameAdvertisingParameters:(MTReceiceAdvertisingParmetersOfSensorHandlerCompletion)completionHandler;




@end

NS_ASSUME_NONNULL_END
