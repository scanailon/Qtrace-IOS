//
//  MTUtils.h
//  MinewSensorKit
//
//  Created by Minewtech on 2019/8/6.
//  Copyright © 2019 Minewtech. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface MTUtils : NSObject

/**
Device password verification.

 @param password the device password.
*/
+ (NSData *)verficationPassword:(NSString *)password;

/**
Device setting poweroff.
 @param isC the device unit of temperature.
*/
+ (NSData *)setUnit:(BOOL)isC;

/**
Set alarm temperature and humidity
 @param tempH the device temperature.
 @param tempL the device humidity.
 @param humH the device temperature.
 @param humL the device humidity.
*/
+ (NSData *)setHTWarning:(int )tempH temL:(int )tempL humH:(int )humH humL:(int )humL;

/**
Close the temperature and humidity alarm switch.
*/
+ (NSData *)setHTAlarmOff;

/**
Device OTA.

 @param data OTA data which you want to update, return data array that is write to device, but write next data after you need to receive notify success.
*/
+ (NSArray *)ota:(NSData *)data;

/**
Device reset.
*/
+ (NSData *)resetDevice;

/**
Device setting storageData.
 @param isStorage the device whether to store data.
*/
+ (NSData *)setIsStorageData:(BOOL)isStorage;

/**
Get deveice info.
*/
+ (NSData *)readDeviceData;

/**
Get device doorSensor history.
*/
+ (NSData *)readDoorSensorHistory;

/**
Get device HTSensor history.
*/
+ (NSData *)readHTHistory;

/**
Deal with device HTSensor history.Return a dictionary of all data, time, temperature, humidity
 @param da the device temperature and humity history data.
 @param formatter  the date formatter.
 @param unitS the device temperature units.
*/
+ (NSDictionary *)dealHTData:(NSData *)da formatter:(NSDateFormatter *)formatter Unit:(NSString *)unitS;

/**
Deal with device DoorSensor history.Return an array of data sorted according to time and all data
 @param da the device doorHistoryData.
 @param formatter the date formatter.
*/
+ (NSArray *)dealDoorHistoryData:(NSData *)da formatter:(NSDateFormatter *)formatter;

@end

NS_ASSUME_NONNULL_END
