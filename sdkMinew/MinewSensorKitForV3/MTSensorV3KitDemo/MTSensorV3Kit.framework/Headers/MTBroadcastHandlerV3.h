//
//  MTBroadcastHandler.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/6.
//  Copyright © 2019 Minewtech. All rights reserved.
//

typedef NS_ENUM(NSUInteger, MTDeviceType) {
    HT = 0,
    SingleTemp,
};

typedef NS_ENUM(NSUInteger, MTHTModel) {
    PR2122 = 0,
    MST01,
};

typedef NS_ENUM(NSUInteger, MTWarningType) {
    Normal = 0,
    AbNormal,
};

#import <Foundation/Foundation.h>
#import <MTSensorV3Kit/MTSensorV3Common.h>


@interface MTBroadcastHandlerV3 : NSObject

// name of device
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

//Temperature unit
@property (nonatomic, assign, readonly) MTTemperatureUnitType temperatureUnit;

// broadcast frame type, HT or SingleTemp.
@property (nonatomic, assign, readonly) MTDeviceType deviceType;

// device warningStatus, Normal or AbNormal.
@property (nonatomic, assign, readonly) MTWarningType deviceWarningStatus;

// screenStatus, Normal or AbNormal.
@property (nonatomic, assign, readonly) MTWarningType screenStatus;

// mark status
@property (nonatomic, assign, readonly) BOOL isMarkStatus;

// device's model of HT, PR2122 or MST01.
@property (nonatomic, assign, readonly) MTHTModel htModel;

// firm version
@property (nonatomic, strong, readonly) NSString *firmVersion;



@end
