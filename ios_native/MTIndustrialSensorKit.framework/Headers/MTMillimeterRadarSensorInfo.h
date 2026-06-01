//
//  MTMillimeterRadarSensorInfo.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/4/6.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>


typedef NS_ENUM(NSUInteger, MTRadarInfoType) {
    MTRadarInfoTypeNone = 0,
    MTRadarInfoTypePeople,
    MTRadarInfoTypeCoordinate,
};


NS_ASSUME_NONNULL_BEGIN

@interface MTMillimeterRadarSensorInfo : NSObject

// 公共
//"RangeRes=XX\n"
//距离分辨率
//
//"VelRes=XX\n"
//速度分辨率
//
//"TIME=XX\n"
//扫描间隔
//
//"PROG=XX\n"
//版本识别
//
//"Range=XX\n"
//径向距离
//
//"Heart_Time=XX\n"
//心跳间隔
//"Heart_Time=XX\n"
//统计周期 人员流量

@property(nonatomic, assign) MTRadarInfoType radarInfoType;

@property(nonatomic, strong) NSString *versionIdentification;
//@property(nonatomic, assign) float versionIdentification;

@property(nonatomic, assign) float rangeResolution;

@property(nonatomic, assign) float verticalResolution;

@property(nonatomic, assign) float scanInterval;

@property(nonatomic, assign) float radialDistance;

@property(nonatomic, assign) float heartTime;

- (void)updateValue:(NSData *)data;

@end

NS_ASSUME_NONNULL_END
