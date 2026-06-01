//
//  MTIDoorContactTimeListData.h
//  MTIndustrialSensorKit
//
//  Created by jelonCai on 2024/3/5.
//  Copyright © 2024 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTIDoorContactTimeListData : NSObject

// The begin value of the time.
@property (nonatomic, assign, readonly) NSTimeInterval beginTimeInterval;

// The end value of the time.
@property (nonatomic, assign, readonly) NSTimeInterval endTimeInterval;

@property (nonatomic, assign, readonly) BOOL doorSensorAlarmStatus;
@property (nonatomic, assign, readonly) BOOL doorSensorAlarmType;
@property (nonatomic, assign, readonly) NSTimeInterval showTimeInterval;
@property (nonatomic, copy, readonly) NSString *showTimeStr;

@end

NS_ASSUME_NONNULL_END
