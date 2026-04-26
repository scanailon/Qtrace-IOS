//
//  MTCentralManager.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/5.
//  Copyright © 2019 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
@class MTPeripheralV3,CBCentralManager;

// iphone bluetooth state, this sdk works well only in poweron state
typedef NS_ENUM(NSUInteger, PowerState) {
    PowerStateUnknown = 0,
    PowerStatePoweredOff,
    PowerStatePoweredOn,
};

// get scanned devices in this block
typedef void(^MTScanBlock)(NSArray<MTPeripheralV3 *> *peripherals);
// get bluetooth change state in this block
typedef void(^BluetoothChangeCompletion)(PowerState statues);


@interface MTCentralManagerV3 : NSObject

// current iphone bluetooth state
@property (nonatomic, assign) PowerState state;

// current scanned devices
@property (nonatomic, strong, readonly) NSArray<MTPeripheralV3 *> *scannedPeris;


/// get shared MTCentralManager instance
/// @return MTC instance
+ (instancetype)sharedInstance;

/// start scan devices,
/// get scanned devices in handler block or "scannedPeris" property.
/// @param handler listen scanned devices
- (void)startScan:(MTScanBlock)handler;

/// stop scanning
- (void)stopScan;

/// try connect to a mtperipheral instance.
/// @param per MTPeripheral instance wanted to be connected
- (void)connectToPeriperal:(MTPeripheralV3 *)per;

/// disconnect from a mtperipheral instance.
/// @param per MTPeripheral instance wanted to be disconnected.
- (void)disconnectFromPeriperal:(MTPeripheralV3 *)per;

/// a callback for iphone bluetooth changes.
/// @param completionHandler the bluetooth status changes block.
- (void)didChangesBluetoothStatus:(BluetoothChangeCompletion)completionHandler;


@end
