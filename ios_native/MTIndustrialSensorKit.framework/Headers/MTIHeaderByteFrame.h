//
//  MTIHeaderByteFrame.h
//  MTIndustrialSensorKit
//
//  Created by jelonCai on 2023/11/14.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTIFrame.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTIHeaderByteFrame : MTIFrame

@property (nonatomic, assign) BOOL doorSensorAlarmStatus;
@property (nonatomic, assign) BOOL tamperProofAlarmStatus;
@property (nonatomic, assign) BOOL triggerAlarmStatus;

@end

NS_ASSUME_NONNULL_END
