//
//  MTCoordinateConfigData.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/4/5.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTCoordinateConfigData : NSObject

@property (nonatomic, assign) int x1Axis;
@property (nonatomic, assign) int y1Axis;
@property (nonatomic, assign) int x2Axis;
@property (nonatomic, assign) int y2Axis;

@end

NS_ASSUME_NONNULL_END
