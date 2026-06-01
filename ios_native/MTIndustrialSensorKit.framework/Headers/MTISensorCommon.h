//
//  MTSensorV3Common.h
//  MTSensorV3Kit
//
//  Created by minew on 2021/8/31.
//  Copyright © 2021 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN


typedef NS_ENUM(NSUInteger, MTITemperatureUnitType) {
    MTICelsius = 0, // ℃
    MTIFahrenheit, // ℉
};

typedef NS_ENUM(NSUInteger, MTIDeviceType) {
    HT = 0,
    SingleTemp,
};

typedef NS_ENUM(NSInteger, MTIFrameType) {
    MTIFrameNone = -3,
    MTIFrameConnectable = -2,
    MTIFrameUnknown = -1,
    MTIFrameDeviceInfo = 0,
    MTIFrameHTSensor,
    MTIFrameDoorContact,
    MTIFrameCoordinateInfo,
    MTIFrameTrafficMonitoring,
    MTIFrameFlexibility,
    MTSModelTypeAssetTemTagInfo,   
    MTSModelTypeDoorContactByte,
    MTSModelTypePt100TemInfo,
    MTSModelTypeLoRaStringInfo,
    MTSModelTypeLoRaTemHInfo,
};

typedef NS_ENUM(NSUInteger, MTIHTModel) {
    PR2122 = 0,
    MST01,
    MST03,
    S4,
    Pt100,
    loRaWan,
};

typedef NS_ENUM(NSUInteger, MTIWarningType) {
    Normal = 0,
    AbNormal,
};

// 人数统计&人员坐标固件AT指令
typedef NS_ENUM(NSInteger, CoordinateRadarSensorConfigType) {
    CRReadDeviceInfo = 0,
    CRReset, // 蓝牙模块复位
    CRRestore, // 雷达模块复位
    CRScanInterval,
    CRMonitorInterval,
    CRHeartbeatInterval,
    CRRadialDistance, // 径向距离
    CRSensitivity,
    CRWorkStatus,
    CRWindowRange,

};

// 人员流量监测固件AT指令
typedef NS_ENUM(NSInteger, TrafficMonitorRadarSensorConfigType) {
    TMRReadDeviceInfo = 0,
    TMRReset, // 蓝牙模块复位
    TMRRestore, // 雷达模块复位
    TMRScanInterval,
    TMRHeartbeatInterval,
    TMRRadialDistance, // 径向距离
    TMRSensitivity,
    TMRXForwardRange,
    TMRXNegativeRange,
    TMRYForwardRange,
    TMRYNegativeRange,
    TMRVerticalDistance,
    
    CRScanXPOSI,
    CRScanXNEGA,
    CRScanYPOSI,
    CRScanYNEGA,
    CRScanHEIGHT,
};


typedef NS_ENUM(NSUInteger, MTSModelType) {
    MTSModelTypeMST01,          // 工业温湿度
    MTSModelTypeRadar,          // 雷达
    MTSModelTypeAssetTemTag,    // 资产测温标签
    MTSModelTypeDoorContact,    // 门磁
    MTSModelTypePT100Temperature, // pt100
    MTSModelTypeLoRaWAN,        // LoRa_0A
    MTSModelTypeLoRaWAN1A,        // LoRa_1A
};

@interface MTISensorCommon : NSObject

@end

NS_ASSUME_NONNULL_END
