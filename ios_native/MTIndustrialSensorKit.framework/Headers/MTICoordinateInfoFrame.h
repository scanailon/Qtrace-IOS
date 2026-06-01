//
//  MTICoordinateInfoFrame.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/3/28.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <MTIndustrialSensorKit/MTIndustrialSensorKit.h>
#import "MTICoordinateInfoData.h"

NS_ASSUME_NONNULL_BEGIN

@interface MTICoordinateInfoFrame : MTIFrame


// 雷达传感器每输出一次监测数据，该序列号自加 1
// Serial number
@property (nonatomic, assign) int serialNumber;

@property (nonatomic, assign) int idInfo;

// Total number of person 监测到的总人数
@property (nonatomic, assign) int totalNumberOfPerson;

@property (nonatomic, strong) NSArray<MTICoordinateInfoData *> *coordinateInfoArr;

- (void)getTotalArrWithCoorDict:(NSDictionary *)dic;

@end

NS_ASSUME_NONNULL_END
