//
//  MTBroadcastHandler.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/6.
//  Copyright © 2019 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
typedef NS_ENUM(NSUInteger, SensorType) {
    HT = 0,
    Door,
};

@interface MTBroadcastHandler : NSObject

// name of device, sometimes available
@property (nonatomic, strong, readonly) NSString *name;

// current rssi value
@property (nonatomic, assign, readonly) NSInteger rssi;

// battery left, sometimes available
@property (nonatomic, assign, readonly) NSInteger battery;

// mac string, sometimes available
@property (nonatomic, strong, readonly) NSString *mac;

// identifier string, sometimes available
@property (nonatomic, strong, readonly) NSString *identifier;

// Temperature
@property (nonatomic, assign, readonly) double temp;

// Humidity
@property (nonatomic, assign, readonly) double humi;

//Temperature unit: 0x00 == ℃ ,0x01 == ℉
@property (nonatomic, assign, readonly) uint8_t reseInfo;


// broadcast frame type
@property (nonatomic, assign, readonly) SensorType type;

//doorStatus
@property (nonatomic, strong, readonly) NSString *doorStatus;

//warningStatus
@property (nonatomic, assign, readonly) uint8_t warningStatus;

@end
