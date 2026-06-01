//
//  MTIFrameHandler.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/3/27.
//  Copyright © 2023 Minewtech. All rights reserved.
//



#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTIFrame.h>


NS_ASSUME_NONNULL_BEGIN

@interface MTIFrameHandler : NSObject

// current rssi value
@property (nonatomic, assign) NSInteger rssi;

// battery
@property (nonatomic, assign) NSInteger battery;

// identifier string
@property (nonatomic, strong) NSString *identifier;

// mac string, sometimes available
@property (nonatomic, strong) NSString *mac;

// name of device, sometimes available
@property (nonatomic, strong) NSString *name;

// current advtising frames.
@property (nonatomic, strong) NSArray<MTIFrame *> *advFrames;

@end

NS_ASSUME_NONNULL_END
