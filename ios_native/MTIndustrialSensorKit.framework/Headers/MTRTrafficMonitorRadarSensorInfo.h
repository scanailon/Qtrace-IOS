//
//  MTRTrafficMonitorRadarSensorInfo.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/4/3.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTMillimeterRadarSensorInfo.h>

NS_ASSUME_NONNULL_BEGIN

// 人员流量监测固件设备信息
typedef NS_ENUM(NSInteger, TrafficMonitorRadarSensorInfoType) {
    TMRIFirewareVersion = 0,
    TMRIRangeResolution,
    TMRISpeedResolution,
    TMRIScanInterval,
    TMRIVersionIdentification,
    TMRIRadialDistance, // 径向距离
    TMRIStatisticalPeriod,
    TMRIWorkingMode,
    TMRIVerticalDistance,
//    TMRIXAxisRange,
//    TMRIYAxisRange,
    TMRIXForwardRange,
    TMRIXNegativeRange,
    TMRIYForwardRange,
    TMRIYNegativeRange,
    TMRISensitivity,
    
    TMRIXForwardScan,
    TMRIXNegativeScan,
    TMRIYForwardScan,
    TMRIYNegativeScan,
    TMRIScanHight,
};


//const NSString *TrafficMonitorRadarSensorInfoTypeStringMap[] = {
//    [TMRIFirewareVersion] = @"SoftVerisonPeopleCnt=XX\n", // 设备版本信息
//    [TMRIRangeResolution] = @"RangeRes=XX\n", // 距离分辨率
//    [TMRISpeedResolution] = @"VelRes=XX\n", // 速度分辨率
//    [TMRIScanInterval] = @"TIME=XX\n", // 扫描间隔
//    [TMRIVersionIdentification] = @"PROG=XX\n", // 版本识别
//    [TMRIRadialDistance] = @"Range=XX\n", // 径向距离
//    [TMRIStatisticalPeriod] = @"Heart_Time=XX\n", // 统计周期
//    [TMRIWorkingMode] = @"Debug=XX\n", // 工作模式
//    [TMRIVerticalDistance] = @"Height=XX\n", // 垂直距离
//    [TMRIXAxisRange] = @"Xboundary-XX", // X轴范围
//    [TMRIYAxisRange] = @"Yboundary-XX", // Y轴范围
//};

static NSString *TrafficMonitorRadarSensorInfoTypeStringMap(TrafficMonitorRadarSensorInfoType type) {
    switch (type) {
        case TMRIFirewareVersion:
            return @"PeopleCntSoftVerison";
//            return @"SoftVerisonPeopleCnt"; // 设备版本信息
        case TMRIRangeResolution:
            return @"RangeRes"; // 距离分辨率
        case TMRISpeedResolution:
            return @"VelRes"; // 速度分辨率
        case TMRIScanInterval:
            return @"TIME"; // 扫描间隔
        case TMRIVersionIdentification:
            return @"PROG"; // 版本识别
        case TMRIRadialDistance:
            return @"Range"; // 径向距离
        case TMRIStatisticalPeriod:
            return @"Heart_Time"; // 统计周期
        case TMRIWorkingMode:
            return @"Debug"; // 工作模式
        case TMRIVerticalDistance:
            return @"Height"; // 垂直距离
        case TMRIXForwardRange:
            return @"XboundaryP"; // X轴正向范围
        case TMRIXNegativeRange:
            return @"XboundaryN"; // X轴负向范围
        case TMRIYForwardRange:
            return @"YboundaryP"; // Y轴正向范围
        case TMRIYNegativeRange:
            return @"YboundaryN"; // Y轴负向范围
        case TMRISensitivity:
            return @"Sen"; // 灵敏度 // Sens
            
        case TMRIScanHight:
            return @"detectionHeight"; // 垂直距离
        case TMRIXForwardScan:
            return @"XdetectionP"; // X轴正向范围
        case TMRIXNegativeScan:
            return @"XdetectionN"; // X轴负向范围
        case TMRIYForwardScan:
            return @"YdetectionP"; // Y轴正向范围
        case TMRIYNegativeScan:
            return @"YdetectionN"; // Y轴负向范围

        default:
            return @"";
    }
}


@interface MTRTrafficMonitorRadarSensorInfo : MTMillimeterRadarSensorInfo

@property(nonatomic, strong) NSDictionary *infoDic;

@property(nonatomic, strong) NSString *softVerisonPeopleCnt;

@property(nonatomic, assign) NSString *workingMode;

@property(nonatomic, assign) float verticalDistance;

@property(nonatomic, assign) float xForwordBoundary;

@property(nonatomic, assign) float xNegativeBoundary;

@property(nonatomic, assign) float yForwordBoundary;

@property(nonatomic, assign) float yNegativeBoundary;

@property(nonatomic, assign) float sensitivity;

@property(nonatomic, assign) float scanHight;
@property(nonatomic, assign) float xForwordScan;
@property(nonatomic, assign) float xNegativeScan;
@property(nonatomic, assign) float yForwordScan;
@property(nonatomic, assign) float yNegativeScan;


//人员流量监测固件设备信息
//
//"SoftVerisonPeopleCnt=XX\n"
//设备版本信息
//
//"Debug=XX\n"
//工作模式
//
//"Height=XX\n"
//垂直距离
//
//"Xboundary-XX"
//X轴范围
//
//"Yboundary-XX"
//Y轴范围

@end

NS_ASSUME_NONNULL_END
