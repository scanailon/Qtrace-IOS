//
//  MTIOnlyTempFrame.h
//  MTIndustrialSensorKit
//
//  Created by jelonCai on 2023/10/17.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTIFrame.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTIOnlyTempFrame : MTIFrame

// Temperature
@property (nonatomic, assign) double temp;

@end

NS_ASSUME_NONNULL_END
