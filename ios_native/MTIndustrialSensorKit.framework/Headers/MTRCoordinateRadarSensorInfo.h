//
//  MTRCoordinateRadarSensorInfo.h
//  MTIndustrialSensorKit
//
//  Created by minew on 2023/4/3.
//  Copyright © 2023 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MTIndustrialSensorKit/MTMillimeterRadarSensorInfo.h>

NS_ASSUME_NONNULL_BEGIN

// 人数统计&人员坐标固件设备信息
typedef NS_ENUM(NSInteger, CoordinateRadarSensorInfoType) {
    CRINone = 0,
    CRIFirewareVersion,
    CRIRangeResolution,
    CRISpeedResolution,
    CRIScanInterval,
    CRIVersionIdentification,
    CRIRadialDistance, // 径向距离
    CRIBoutRate,
    CRISensitivity,
    CRIHeartbeatInterval,
    CRIMonitorInterval,
    
    CRIXForwardScan,
    CRIXNegativeScan,
    CRIYForwardScan,
    CRIYNegativeScan,
    CRIScanHight,
};

//const NSString * _Nonnull CoordinateRadarSensorInfoTypeStringMap[] = {
//    [CRIFirewareVersion] = @"SoftVerison", // 设备版本信息
//    [CRIRangeResolution] = @"RangeRes", // 距离分辨率
//    [CRISpeedResolution] = @"VelRes", // 速度分辨率
//    [CRIScanInterval] = @"TIME", // 扫描间隔
//    [CRIVersionIdentification] = @"PROG", // 版本识别
//    [CRIRadialDistance] = @"Range", // 径向距离
//    [CRIBoutRate] = @"BautRate", //波特率
//    [CRISensitivity] = @"Sens", // 灵敏度
//    [CRIHeartbeatInterval] = @"Heart_Time", // 心跳间隔
//    [CRIMonitorInterval] = @"Monitor_Time", // 监测间隔
//};

static NSString *CoordinateRadarSensorInfoTypeStringMap(CoordinateRadarSensorInfoType type) {
    switch (type) {
        case CRIFirewareVersion:
            return @"SoftVerison"; // 设备版本信息
        case CRIRangeResolution:
            return @"RangeRes"; // 距离分辨率
        case CRISpeedResolution:
            return @"VelRes"; // 速度分辨率
        case CRIScanInterval:
            return @"TIME"; // 扫描间隔
        case CRIVersionIdentification:
            return @"PROG"; // 版本识别
        case CRIRadialDistance:
            return @"Range"; // 径向距离
        case CRIBoutRate:
            return @"BautRate"; //波特率
        case CRISensitivity:
            return @"Sen"; // 灵敏度 // Sens
        case CRIHeartbeatInterval:
            return @"Heart_Time"; // 心跳间隔
        case CRIMonitorInterval:
            return @"Monitor_Time"; // 监测间隔
            
        case CRIScanHight:
            return @"detectionHeight"; // 垂直距离
        case CRIXForwardScan:
            return @"XdetectionN"; // X轴正向范围
        case CRIXNegativeScan:
            return @"XdetectionP"; // X轴负向范围
        case CRIYForwardScan:
            return @"YdetectionN"; // Y轴正向范围
        case CRIYNegativeScan:
            return @"YdetectionP"; // Y轴负向范围
        default:
            return @"";
    }
}



@interface MTRCoordinateRadarSensorInfo : MTMillimeterRadarSensorInfo

@property(nonatomic, strong) NSDictionary *infoDic;

@property(nonatomic, strong) NSString *softVersion;
//@property(nonatomic, assign) float softVersion;

@property(nonatomic, assign) float bautRate;

@property(nonatomic, assign) float sensitivity;

@property(nonatomic, assign) float monitorInterval;



//人数统计&人员坐标固件设备信息
//
//"SoftVerison=XX\n"
//设备版本信息
//
//"BautRate=XX\n"
//波特率
//
//"Sens=XX\n"
//灵敏度
//
//"Monitor_Time=XX\n"
//监测间隔

@end

NS_ASSUME_NONNULL_END
