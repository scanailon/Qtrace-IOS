//
//  MTIFrame.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/3/27.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTISensorCommon.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTIFrame : NSObject

// frameType of MinewFrame instance
@property (nonatomic, assign) MTIFrameType frameType;

// check two frame is the same or not
- (BOOL)isSameFrame:(MTIFrame *)frame;

@end

NS_ASSUME_NONNULL_END
