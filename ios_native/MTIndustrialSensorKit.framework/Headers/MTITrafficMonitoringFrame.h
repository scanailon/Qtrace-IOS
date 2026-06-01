//
//  MTITrafficMonitoringFrame.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/3/28.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <MTIndustrialSensorKit/MTIndustrialSensorKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTITrafficMonitoringFrame : MTIFrame

//10
//1
//Serial number
//-
//雷达传感器每输出一次监测数据，该序列号自加 1
//
//
//11
//2
//Number of entries
//-
//LE, 雷达检测到的进门次数
//
//
//13
//2
//Number of exits
//-
//LE, 雷达检测到的出门次数

// Serial number
@property (nonatomic, assign) int serialNumber;

// Number of entries
@property (nonatomic, assign) int numberOfEntries;

// Number of exits
@property (nonatomic, assign) int numberOfExits;


@end

NS_ASSUME_NONNULL_END
