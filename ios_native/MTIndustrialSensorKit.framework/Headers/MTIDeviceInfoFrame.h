//
//  MTIDeviceInfoFrame.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/3/23.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTIFrame.h>

NS_ASSUME_NONNULL_BEGIN


@interface MTIDeviceInfoFrame : MTIFrame

// battery 
@property (nonatomic, assign) NSInteger battery;

// mac string
@property (nonatomic, strong) NSString *mac;

// firm version
@property (nonatomic, strong) NSString *firmVersion;

// model type
@property (nonatomic, assign) MTSModelType modelType;


@end

NS_ASSUME_NONNULL_END
