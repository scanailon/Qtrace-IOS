//
//  MTSensorV3Common.h
//  MTSensorV3Kit
//
//  Created by minew on 2021/8/31.
//  Copyright © 2021 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN


typedef NS_ENUM(NSUInteger, MTTemperatureUnitType) {
    Celsius = 0, // ℃
    Fahrenheit, // ℉
};

@interface MTSensorV3Common : NSObject

@end

NS_ASSUME_NONNULL_END
