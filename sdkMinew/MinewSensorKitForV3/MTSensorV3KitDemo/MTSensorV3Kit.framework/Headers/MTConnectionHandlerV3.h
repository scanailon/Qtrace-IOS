//
//  MTConnectionHandler.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/6.
//  Copyright © 2019 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>


NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSUInteger, Connection) {
    Disconnected = 0,
    Connected,
    Connecting,
    Validating,
    Vaildated,
    VaildateFailed,
    PasswordVaildateFailed,
};

// ota status,
typedef NS_ENUM(NSInteger, OTAState) {
    OTAStateUndefined = 0,
    OTAStateStarting = 1,
    OTAStateUploading = 2,
    OTAStateDisconnecting = 3,
    OTAStateCompleted = 4,
    OTAStateAborted = 5,
    OTAStateFailed = 6,
};



// ota status change block
typedef void(^OTAStateBlock)(OTAState);
// ota progress change block
typedef void(^OTAProgressBlock)(float);
// ota error block
typedef void(^OTAErrorBlock)(NSError *);

// connection change block
typedef void(^ConnectionChangeCompletion)(Connection connection);


@class MTConnectionHandlerV3,MTPeripheralV3,CBPeripheral, MTSensorHandlerV3;

@protocol ConnectionDelegate <NSObject>

//return current connectionHandler object
- (MTConnectionHandlerV3 *)returnConnection;

@end


@interface MTConnectionHandlerV3 : NSObject


// macString of device
@property (nonatomic, strong) NSString *macString;

//sensorHandler of device
@property (nonatomic, strong, readonly) MTSensorHandlerV3 *sensorHandler;

/// current connection status.
@property (nonatomic, readonly, assign) Connection connection;


/// listen the changes of connection.
/// !!! this is a callback method, please listen to the block, it will execute when the device changes connection.
/// @param completionHandler  the connection changing block.
- (void)didChangeConnection:(ConnectionChangeCompletion)completionHandler;


/// ota device by using this method, input  firmware data, then start ota, get statusChange in stateHandler, get firmware file upload progress in progressHandler, get error in errorHandler
/// @param originOtaData data of ota
/// @param stateHandler listen status change, only "Completed" means ota successfully.
/// @param progressHandler listen file uploading progress
/// @param errorHandler listen errors in ota stage
- (void)startOTAWithOTAData:(NSData *)originOtaData
    stateHandler:(OTAStateBlock)stateHandler
    progressHandler:(OTAProgressBlock)progressHandler
    errorHandler:(OTAErrorBlock)errorHandler;


@end

NS_ASSUME_NONNULL_END
