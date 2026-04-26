//
//  MTHistoryData.h
//  MTSensorV3Kit
//
//  Created by minew on 2021/8/5.
//  Copyright © 2021 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTSensorV3Kit/MTSensorV3Common.h>


NS_ASSUME_NONNULL_BEGIN

@interface MTHistoryData : NSObject

// humidity of device
@property (nonatomic, assign, readonly) double humi;

// temperature of device
@property (nonatomic, assign, readonly) double temp;

// Formatted time string
@property (nonatomic, strong, readonly) NSString *timeStr;

// The original value of the time.
@property (nonatomic, assign, readonly) NSTimeInterval timeInterval;

// origin history data
@property (nonatomic, strong, readonly) NSData *historyOriginData;

@end

NS_ASSUME_NONNULL_END
